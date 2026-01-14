const Lead = require('../models/Lead');
const Project = require('../models/Project');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Invoice = require('../models/Invoice');

// @desc    Get admin dashboard statistics
// @route   GET /api/dashboard/admin
// @access  Private (Admin only)
const getAdminDashboard = async (req, res) => {
  try {
    // Total counts
    const totalLeads = await Lead.countDocuments();
    const totalProjects = await Project.countDocuments();
    const totalInvoices = await Invoice.countDocuments();
    const totalCSRs = await User.countDocuments({ role: 'csr' });

    // Total revenue from completed payments
    const revenueData = await Payment.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    // Conversion rate (Converted leads / Total leads)
    const convertedLeads = await Lead.countDocuments({ status: 'Converted' });
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0;

    // Leads by status
    const leadsByStatus = await Lead.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Projects by status
    const projectsByStatus = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$value' }
        }
      }
    ]);

    // CSR-wise performance
    const csrPerformance = await User.aggregate([
      { $match: { role: 'csr' } },
      {
        $lookup: {
          from: 'leads',
          localField: '_id',
          foreignField: 'createdBy',
          as: 'leads'
        }
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'createdBy',
          as: 'projects'
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'createdBy',
          as: 'payments'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          totalLeads: { $size: '$leads' },
          totalProjects: { $size: '$projects' },
          totalRevenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$payments',
                    as: 'payment',
                    cond: { $eq: ['$$payment.status', 'Completed'] }
                  }
                },
                as: 'payment',
                in: '$$payment.amount'
              }
            }
          },
          conversionRate: {
            $cond: {
              if: { $gt: [{ $size: '$leads' }, 0] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      {
                        $size: {
                          $filter: {
                            input: '$leads',
                            as: 'lead',
                            cond: { $eq: ['$$lead.status', 'Converted'] }
                          }
                        }
                      },
                      { $size: '$leads' }
                    ]
                  },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentLeads = await Lead.find({ createdAt: { $gte: thirtyDaysAgo } })
      .select('name email status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentProjects = await Project.find({ createdAt: { $gte: thirtyDaysAgo } })
      .select('name client status budget createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentInvoices = await Invoice.find({ createdAt: { $gte: thirtyDaysAgo } })
      .select('invoiceNumber amount status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Daily stats for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyLeads = await Lead.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyRevenue = await Payment.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, status: 'Completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Monthly revenue for last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyRevenue = await Payment.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo }, status: 'Completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalLeads,
          totalProjects,
          totalInvoices,
          totalRevenue,
          totalCSRs,
          conversionRate: parseFloat(conversionRate)
        },
        leadsByStatus,
        projectsByStatus,
        csrPerformance,
        recentActivity: {
          leads: recentLeads,
          projects: recentProjects,
          invoices: recentInvoices
        },
        dailyStats: {
          leads: dailyLeads,
          revenue: dailyRevenue
        },
        monthlyRevenue
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
  }
};

// @desc    Get CSR dashboard statistics
// @route   GET /api/dashboard/csr
// @access  Private (CSR only)
const getCSRDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Total counts for this CSR
    const totalLeads = await Lead.countDocuments({ createdBy: userId });
    const totalProjects = await Project.countDocuments({ createdBy: userId });

    // Total revenue from completed payments
    const revenueData = await Payment.aggregate([
      { $match: { createdBy: userId, status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    // Conversion rate
    const convertedLeads = await Lead.countDocuments({ createdBy: userId, status: 'Converted' });
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0;

    // Leads by status
    const leadsByStatus = await Lead.aggregate([
      { $match: { createdBy: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Projects by status
    const projectsByStatus = await Project.aggregate([
      { $match: { createdBy: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$value' }
        }
      }
    ]);

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentLeads = await Lead.find({ 
      createdBy: userId, 
      createdAt: { $gte: thirtyDaysAgo } 
    })
      .select('name email status createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentProjects = await Project.find({
      createdBy: userId,
      createdAt: { $gte: thirtyDaysAgo }
    })
      .select('name client status budget createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    // Daily stats for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyLeads = await Lead.aggregate([
      { $match: { createdBy: userId, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyRevenue = await Payment.aggregate([
      { $match: { createdBy: userId, createdAt: { $gte: sevenDaysAgo }, status: 'Completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalLeads,
          totalProjects,
          totalRevenue,
          conversionRate: parseFloat(conversionRate)
        },
        leadsByStatus,
        projectsByStatus,
        recentActivity: {
          leads: recentLeads,
          projects: recentProjects
        },
        dailyStats: {
          leads: dailyLeads,
          revenue: dailyRevenue
        }
      }
    });
  } catch (error) {
    console.error('Get CSR dashboard error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
  }
};

// @desc    Get agent-wise analytics (leads by agent, date-wise, category-wise)
// @route   GET /api/dashboard/agent-analytics
// @access  Private (Admin only)
const getAgentAnalytics = async (req, res) => {
  try {
    // Leads per agent
    const leadsPerAgent = await Lead.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'agent'
        }
      },
      { $unwind: '$agent' },
      {
        $group: {
          _id: '$createdBy',
          agentName: { $first: '$agent.name' },
          agentEmail: { $first: '$agent.email' },
          totalLeads: { $sum: 1 },
          convertedLeads: {
            $sum: { $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 1,
          agentName: 1,
          agentEmail: 1,
          totalLeads: 1,
          convertedLeads: 1,
          conversionRate: {
            $cond: {
              if: { $gt: ['$totalLeads', 0] },
              then: {
                $multiply: [
                  { $divide: ['$convertedLeads', '$totalLeads'] },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      { $sort: { totalLeads: -1 } }
    ]);

    // Leads per agent DATE-WISE (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const leadsPerAgentDateWise = await Lead.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'agent'
        }
      },
      { $unwind: '$agent' },
      {
        $group: {
          _id: {
            agentId: '$createdBy',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          agentName: { $first: '$agent.name' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.agentId',
          agentName: { $first: '$agentName' },
          dailyData: {
            $push: {
              date: '$_id.date',
              count: '$count'
            }
          },
          totalLeads: { $sum: '$count' }
        }
      },
      { $sort: { totalLeads: -1 } }
    ]);

    // Leads per agent CATEGORY-WISE (by source/status)
    const leadsPerAgentCategoryWise = await Lead.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'agent'
        }
      },
      { $unwind: '$agent' },
      {
        $group: {
          _id: {
            agentId: '$createdBy',
            category: '$source'
          },
          agentName: { $first: '$agent.name' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.agentId',
          agentName: { $first: '$agentName' },
          categories: {
            $push: {
              category: '$_id.category',
              count: '$count'
            }
          },
          totalLeads: { $sum: '$count' }
        }
      },
      { $sort: { totalLeads: -1 } }
    ]);

    // Leads per agent STATUS-WISE
    const leadsPerAgentStatusWise = await Lead.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'agent'
        }
      },
      { $unwind: '$agent' },
      {
        $group: {
          _id: {
            agentId: '$createdBy',
            status: '$status'
          },
          agentName: { $first: '$agent.name' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.agentId',
          agentName: { $first: '$agentName' },
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          },
          totalLeads: { $sum: '$count' }
        }
      },
      { $sort: { totalLeads: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        leadsPerAgent,
        leadsPerAgentDateWise,
        leadsPerAgentCategoryWise,
        leadsPerAgentStatusWise
      }
    });
  } catch (error) {
    console.error('Get agent analytics error:', error);
    res.status(500).json({ message: 'Server error while fetching agent analytics' });
  }
};

module.exports = {
  getAdminDashboard,
  getCSRDashboard,
  getAgentAnalytics
};
