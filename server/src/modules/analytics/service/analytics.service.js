const Building = require('../../buildings/model/building.model');
const Room = require('../../rooms/model/room.model');
const Audit = require('../../audits/model/audit.model');
const AuditAssignment = require('../../audits/model/auditAssignment.model');
const User = require('../../users/model/user.model');
const Role = require('../../users/model/role.model');

class AnalyticsService {
  async getDashboardStats() {
    const totalBuildings = await Building.countDocuments({ isDeleted: { $ne: true } });
    const totalRooms = await Room.countDocuments({ isDeleted: { $ne: true } });
    
    // Status counts
    const totalAssignments = await AuditAssignment.countDocuments();
    const assignedCount = await AuditAssignment.countDocuments({ status: 'Assigned' });
    const inProgressCount = await AuditAssignment.countDocuments({ status: 'In Progress' });
    const submittedCount = await AuditAssignment.countDocuments({ status: 'Submitted' });
    const approvedCount = await AuditAssignment.countDocuments({ status: 'Approved' });
    const reviewRequiredCount = await AuditAssignment.countDocuments({ status: 'Review Required' });
    const rejectedCount = await AuditAssignment.countDocuments({ status: 'Rejected' });

    // Calculate average confidence score for completed audits
    const scoreAgg = await Audit.aggregate([
      { $match: { status: { $in: ['Submitted', 'Approved', 'Review Required'] } } },
      { $group: { _id: null, avgScore: { $avg: '$confidenceScore' } } }
    ]);
    const averageConfidence = scoreAgg.length > 0 ? Math.round(scoreAgg[0].avgScore) : 0;

    // Room counts by type
    const roomsByType = await Room.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$roomType', count: { $sum: 1 } } }
    ]);

    const formattedRoomsByType = roomsByType.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    return {
      buildingsCount: totalBuildings,
      roomsCount: totalRooms,
      assignmentsCount: totalAssignments,
      statusCounts: {
        Assigned: assignedCount,
        InProgress: inProgressCount,
        Submitted: submittedCount,
        Approved: approvedCount,
        ReviewRequired: reviewRequiredCount,
        Rejected: rejectedCount
      },
      averageConfidence,
      roomsByType: formattedRoomsByType
    };
  }

  async getTrends() {
    // Audit submission counts for last 7 days
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 7);

    const trends = await Audit.aggregate([
      { $match: { submittedAt: { $gte: dateLimit } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
          count: { $sum: 1 },
          avgScore: { $avg: '$confidenceScore' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return trends.map(t => ({
      date: t._id,
      count: t.count,
      averageConfidence: Math.round(t.avgScore)
    }));
  }

  async getAuditorStats() {
    // Find Auditor role id
    const auditorRole = await Role.findOne({ name: 'Auditor' });
    if (!auditorRole) return [];

    const auditors = await User.find({ roleId: auditorRole._id, isDeleted: { $ne: true } });

    const stats = [];
    for (const aud of auditors) {
      const assigned = await AuditAssignment.countDocuments({ auditorId: aud._id });
      const completed = await AuditAssignment.countDocuments({ 
        auditorId: aud._id, 
        status: { $in: ['Approved', 'Submitted', 'Review Required', 'Rejected'] } 
      });

      const scoreAgg = await Audit.aggregate([
        { $match: { auditorId: aud._id, status: { $in: ['Approved', 'Submitted', 'Review Required', 'Rejected'] } } },
        { $group: { _id: null, avgScore: { $avg: '$confidenceScore' } } }
      ]);
      const avgConfidence = scoreAgg.length > 0 ? Math.round(scoreAgg[0].avgScore) : 0;

      stats.push({
        id: aud._id,
        name: aud.name,
        email: aud.email,
        assignedCount: assigned,
        completedCount: completed,
        averageConfidence: avgConfidence
      });
    }

    return stats;
  }
}

module.exports = new AnalyticsService();
