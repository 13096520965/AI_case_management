const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../legal_case_management.db');
const db = new sqlite3.Database(dbPath);

// 生成测试提醒数据
const generateNotifications = () => {
  const notifications = [];
  const now = new Date();
  
  // 类型和内容模板 - 更丰富的业务场景
  const templates = [
    // 节点到期提醒 (deadline)
    {
      taskType: 'deadline',
      relatedType: 'process_node',
      content: '案件"张三诉李四合同纠纷案"流程节点"证据收集"将在明天到期，请及时处理',
      daysOffset: 1
    },
    {
      taskType: 'deadline',
      relatedType: 'process_node',
      content: '案件"王五劳动争议案"流程节点"提交答辩状"将在3天后到期，请提前准备',
      daysOffset: 3
    },
    {
      taskType: 'deadline',
      relatedType: 'process_node',
      content: '案件"赵六知识产权案"流程节点"一审判决"预计明天完成，请关注',
      daysOffset: 1
    },
    {
      taskType: 'deadline',
      relatedType: 'process_node',
      content: '案件"孙七房产纠纷案"流程节点"调解协商"将在一周后到期',
      daysOffset: 7
    },
    {
      taskType: 'deadline',
      relatedType: 'process_node',
      content: '案件"周八交通事故案"流程节点"庭前会议"将在2天后举行，请做好准备',
      daysOffset: 2
    },
    
    // 节点超期提醒 (overdue)
    {
      taskType: 'overdue',
      relatedType: 'process_node',
      content: '【紧急】案件"李四合同案"流程节点"开庭准备"已超期2天，请尽快完成',
      daysOffset: -2
    },
    {
      taskType: 'overdue',
      relatedType: 'process_node',
      content: '【紧急】案件"王五劳动案"流程节点"证据交换"已超期5天，请立即处理',
      daysOffset: -5
    },
    {
      taskType: 'overdue',
      relatedType: 'process_node',
      content: '【紧急】案件"赵六知产案"流程节点"提交证据"已超期3天，请立即补充',
      daysOffset: -3
    },
    {
      taskType: 'overdue',
      relatedType: 'process_node',
      content: '【紧急】案件"孙七房产案"流程节点"质证环节"已超期1天，请尽快完成',
      daysOffset: -1
    },
    
    // 费用支付提醒 (payment)
    {
      taskType: 'payment',
      relatedType: 'cost',
      content: '案件"张三合同案"律师费需要支付，金额：50,000元，请及时安排',
      daysOffset: 0
    },
    {
      taskType: 'payment',
      relatedType: 'cost',
      content: '案件"李四劳动案"诉讼费即将到期，金额：8,000元，请在2天内支付',
      daysOffset: 2
    },
    {
      taskType: 'payment',
      relatedType: 'cost',
      content: '案件"王五知产案"鉴定费已到期，金额：12,000元，请尽快支付',
      daysOffset: -1
    },
    {
      taskType: 'payment',
      relatedType: 'cost',
      content: '案件"赵六房产案"评估费需要支付，金额：15,000元',
      daysOffset: 0
    },
    {
      taskType: 'payment',
      relatedType: 'cost',
      content: '案件"孙七交通案"保全费即将到期，金额：5,000元，请在3天内支付',
      daysOffset: 3
    },
    {
      taskType: 'payment',
      relatedType: 'cost',
      content: '案件"周八合同案"公证费需要支付，金额：3,000元',
      daysOffset: 1
    },
    
    // 协作任务提醒 (task)
    {
      taskType: 'task',
      relatedType: 'collaboration_task',
      content: '协作任务"准备张三案辩护材料"已分配给您，请在2天内完成',
      daysOffset: 0
    },
    {
      taskType: 'task',
      relatedType: 'collaboration_task',
      content: '协作任务"整理李四案证据清单"需要您的审核，请及时查看',
      daysOffset: 0
    },
    {
      taskType: 'task',
      relatedType: 'collaboration_task',
      content: '协作任务"联系王五案证人"已完成，请查看结果并反馈',
      daysOffset: -1
    },
    {
      taskType: 'task',
      relatedType: 'collaboration_task',
      content: '协作任务"起草赵六案起诉状"已分配给您，截止日期为明天',
      daysOffset: 1
    },
    {
      taskType: 'task',
      relatedType: 'collaboration_task',
      content: '协作任务"准备孙七案庭审预案"需要您参与讨论',
      daysOffset: 0
    },
    
    // 系统通知 (system)
    {
      taskType: 'system',
      relatedType: 'case',
      content: '系统提醒：案件"张三诉李四合同纠纷案"有新的文档上传，请查看',
      daysOffset: 0
    },
    {
      taskType: 'system',
      relatedType: 'case',
      content: '系统提醒：案件"王五劳动争议案"状态已更新为"审理中"',
      daysOffset: -1
    },
    {
      taskType: 'system',
      relatedType: 'case',
      content: '系统提醒：案件"赵六知识产权案"开庭时间已确定为2025年12月5日',
      daysOffset: 0
    },
    {
      taskType: 'system',
      relatedType: 'case',
      content: '系统提醒：案件"孙七房产纠纷案"有新的协作成员加入',
      daysOffset: 0
    },
    {
      taskType: 'system',
      relatedType: 'case',
      content: '系统提醒：案件"周八交通事故案"证据材料已通过审核',
      daysOffset: -1
    },
    
    // 更多节点到期提醒
    {
      taskType: 'deadline',
      relatedType: 'process_node',
      content: '案件"钱九民事案"流程节点"提交代理词"将在5天后到期',
      daysOffset: 5
    },
    {
      taskType: 'deadline',
      relatedType: 'process_node',
      content: '案件"吴十刑事案"流程节点"会见当事人"将在明天进行',
      daysOffset: 1
    },
    
    // 更多费用支付提醒
    {
      taskType: 'payment',
      relatedType: 'cost',
      content: '案件"郑十一商标案"代理费第二期款项需要支付，金额：30,000元',
      daysOffset: 0
    },
    {
      taskType: 'payment',
      relatedType: 'cost',
      content: '案件"冯十二专利案"翻译费需要支付，金额：6,000元，请在一周内完成',
      daysOffset: 7
    },
    
    // 更多协作任务
    {
      taskType: 'task',
      relatedType: 'collaboration_task',
      content: '协作任务"审核陈十三案法律意见书"需要您的确认',
      daysOffset: 0
    },
    {
      taskType: 'task',
      relatedType: 'collaboration_task',
      content: '协作任务"准备褚十四案质证意见"已分配，请在3天内完成',
      daysOffset: 3
    }
  ];

  // 为每个模板生成提醒，前20条标记为未读，后面的标记为已读
  templates.forEach((template, index) => {
    const scheduledTime = new Date(now);
    scheduledTime.setDate(scheduledTime.getDate() + template.daysOffset);
    
    // 前20条标记为未读，后面的标记为已读
    const status = index < 20 ? 'unread' : 'read';
    
    notifications.push({
      relatedId: Math.floor(Math.random() * 20) + 1,
      relatedType: template.relatedType,
      taskType: template.taskType,
      scheduledTime: scheduledTime.toISOString(),
      content: template.content,
      status: status,
      createdAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  });

  return notifications;
};

// 插入测试数据
const seedNotifications = () => {
  return new Promise((resolve, reject) => {
    const notifications = generateNotifications();
    
    db.serialize(() => {
      // 清空现有提醒数据（可选）
      db.run('DELETE FROM notification_tasks', (err) => {
        if (err) {
          console.error('Error clearing notification_tasks:', err);
        } else {
          console.log('Cleared existing notification data');
        }
      });

      // 插入新数据
      const stmt = db.prepare(`
        INSERT INTO notification_tasks (
          related_id, related_type, task_type, scheduled_time, 
          content, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      let insertCount = 0;
      notifications.forEach((notification) => {
        stmt.run(
          notification.relatedId,
          notification.relatedType,
          notification.taskType,
          notification.scheduledTime,
          notification.content,
          notification.status,
          notification.createdAt,
          (err) => {
            if (err) {
              console.error('Error inserting notification:', err);
            } else {
              insertCount++;
            }
          }
        );
      });

      stmt.finalize((err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Successfully inserted ${insertCount} notification records`);
          resolve(insertCount);
        }
      });
    });
  });
};

// 执行数据填充
seedNotifications()
  .then((count) => {
    console.log(`\n✅ Notification test data seeded successfully!`);
    console.log(`Total records: ${count}`);
    db.close();
  })
  .catch((error) => {
    console.error('❌ Error seeding notification data:', error);
    db.close();
  });
