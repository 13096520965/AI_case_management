const NotificationTask = require('../models/NotificationTask');
const { beijingNow } = require('../utils/time');

/**
 * 提醒发送服务
 */
class NotificationSender {
  /**
   * 发送系统消息
   * @param {Object} notification - 提醒任务对象
   * @returns {Promise<Object>} 发送结果
   */
  async sendSystemMessage(notification) {
    try {
      console.log(`发送系统消息: ${notification.content}`);
      
      // 这里实现系统内消息推送逻辑
      // 在实际应用中，可以通过 WebSocket 或 SSE 推送给前端
      
      // 记录发送历史
      await this.recordSendHistory(notification.id, 'system', 'success');

      return {
        success: true,
        method: 'system',
        message: 'System message sent successfully'
      };
    } catch (error) {
      console.error('发送系统消息失败:', error);
      await this.recordSendHistory(notification.id, 'system', 'failed', error.message);
      throw error;
    }
  }

  /**
   * 发送短信（预留接口）
   * @param {Object} notification - 提醒任务对象
   * @param {string} phoneNumber - 手机号
   * @returns {Promise<Object>} 发送结果
   */
  async sendSMS(notification, phoneNumber) {
    try {
      console.log(`[预留接口] 发送短信到 ${phoneNumber}: ${notification.content}`);
      
      // TODO: 集成第三方短信服务（如阿里云、腾讯云等）
      // 示例代码：
      // const smsClient = new SMSClient(config);
      // await smsClient.send({
      //   phoneNumber: phoneNumber,
      //   templateCode: 'SMS_TEMPLATE_CODE',
      //   params: { content: notification.content }
      // });

      await this.recordSendHistory(notification.id, 'sms', 'pending', '短信接口未配置');

      return {
        success: false,
        method: 'sms',
        message: 'SMS interface not configured yet'
      };
    } catch (error) {
      console.error('发送短信失败:', error);
      await this.recordSendHistory(notification.id, 'sms', 'failed', error.message);
      throw error;
    }
  }

  /**
   * 发送邮件（预留接口）
   * @param {Object} notification - 提醒任务对象
   * @param {string} email - 邮箱地址
   * @returns {Promise<Object>} 发送结果
   */
  async sendEmail(notification, email) {
    try {
      console.log(`[预留接口] 发送邮件到 ${email}: ${notification.content}`);
      
      // TODO: 集成邮件服务（如 nodemailer）
      // 示例代码：
      // const transporter = nodemailer.createTransport(config);
      // await transporter.sendMail({
      //   from: 'noreply@legalcase.com',
      //   to: email,
      //   subject: '案件提醒',
      //   text: notification.content
      // });

      await this.recordSendHistory(notification.id, 'email', 'pending', '邮件接口未配置');

      return {
        success: false,
        method: 'email',
        message: 'Email interface not configured yet'
      };
    } catch (error) {
      console.error('发送邮件失败:', error);
      await this.recordSendHistory(notification.id, 'email', 'failed', error.message);
      throw error;
    }
  }

  /**
   * 发送提醒（根据配置选择发送方式）
   * @param {number} notificationId - 提醒任务 ID
   * @param {Object} options - 发送选项
   * @returns {Promise<Object>} 发送结果
   */
  async sendNotification(notificationId, options = {}) {
    try {
      const notification = await NotificationTask.findById(notificationId);
      
      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.status !== 'pending') {
        return {
          success: false,
          message: 'Notification already processed'
        };
      }

      const results = [];

      // 发送系统消息（默认）
      if (options.sendSystem !== false) {
        const systemResult = await this.sendSystemMessage(notification);
        results.push(systemResult);
      }

      // 发送短信（如果提供了手机号）
      if (options.phoneNumber) {
        const smsResult = await this.sendSMS(notification, options.phoneNumber);
        results.push(smsResult);
      }

      // 发送邮件（如果提供了邮箱）
      if (options.email) {
        const emailResult = await this.sendEmail(notification, options.email);
        results.push(emailResult);
      }

      // 更新提醒状态为已发送
      await NotificationTask.update(notificationId, {
        status: 'sent'
      });

      return {
        success: true,
        results: results,
        message: 'Notification sent successfully'
      };
    } catch (error) {
      console.error('发送提醒失败:', error);
      throw error;
    }
  }

  /**
   * 批量发送待发送的提醒
   * @returns {Promise<Object>} 发送结果统计
   */
  async sendPendingNotifications() {
    try {
      const pendingNotifications = await NotificationTask.findPendingTasks();
      
      console.log(`找到 ${pendingNotifications.length} 条待发送的提醒`);

      let successCount = 0;
      let failedCount = 0;

      for (const notification of pendingNotifications) {
        try {
          await this.sendNotification(notification.id);
          successCount++;
        } catch (error) {
          console.error(`发送提醒 ${notification.id} 失败:`, error);
          failedCount++;
        }
      }

      console.log(`提醒发送完成: 成功 ${successCount}, 失败 ${failedCount}`);

      return {
        success: true,
        total: pendingNotifications.length,
        successCount,
        failedCount
      };
    } catch (error) {
      console.error('批量发送提醒失败:', error);
      throw error;
    }
  }

  /**
   * 记录发送历史
   * @param {number} notificationId - 提醒任务 ID
   * @param {string} method - 发送方式
   * @param {string} status - 发送状态
   * @param {string} details - 详细信息
   */
  async recordSendHistory(notificationId, method, status, details = null) {
    try {
      const { run } = require('../config/database');
      
      const sql = `
        INSERT INTO notification_send_history (
          notification_id, send_method, send_status, send_time, details
        ) VALUES (?, ?, ?, ?, ?)
      `;

      await run(sql, [notificationId, method, status, beijingNow(), details]);
    } catch (error) {
      console.error('记录发送历史失败:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 获取发送历史
   * @param {number} notificationId - 提醒任务 ID
   * @returns {Promise<Array>} 发送历史列表
   */
  async getSendHistory(notificationId) {
    try {
      const { query } = require('../config/database');
      
      const sql = `
        SELECT * FROM notification_send_history 
        WHERE notification_id = ?
        ORDER BY send_time DESC
      `;

      return await query(sql, [notificationId]);
    } catch (error) {
      console.error('获取发送历史失败:', error);
      return [];
    }
  }

  /**
   * 重新发送失败的提醒
   * @param {number} notificationId - 提醒任务 ID
   * @returns {Promise<Object>} 发送结果
   */
  async resendNotification(notificationId) {
    try {
      // 重置状态为待发送
      await NotificationTask.update(notificationId, {
        status: 'pending'
      });

      // 发送提醒
      return await this.sendNotification(notificationId);
    } catch (error) {
      console.error('重新发送提醒失败:', error);
      throw error;
    }
  }
}

// 创建单例
const sender = new NotificationSender();

module.exports = sender;
