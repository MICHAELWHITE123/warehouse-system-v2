import { BaseModel } from './BaseModel';
import { Statistics } from '../types/database';

export class StatisticsModel extends BaseModel {
  async getOverallStatistics(): Promise<Statistics> {
    // Статистика по оборудованию
    const equipmentStatsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'available') as available,
        COUNT(*) FILTER (WHERE status = 'in-use') as in_use,
        COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance
      FROM equipment
    `;
    const equipmentStats = await this.executeQuerySingle<{
      total: string;
      available: string;
      in_use: string;
      maintenance: string;
    }>(equipmentStatsQuery);

    // Статистика по категориям и локациям
    const categoriesCountQuery = 'SELECT COUNT(*) as count FROM categories';
    const locationsCountQuery = 'SELECT COUNT(*) as count FROM locations';
    const stacksCountQuery = 'SELECT COUNT(*) as count FROM equipment_stacks';

    const [categoriesResult, locationsResult, stacksResult] = await Promise.all([
      this.executeQuerySingle<{ count: string }>(categoriesCountQuery),
      this.executeQuerySingle<{ count: string }>(locationsCountQuery),
      this.executeQuerySingle<{ count: string }>(stacksCountQuery)
    ]);

    // Статистика по отгрузкам
    const shipmentsStatsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'preparing') as preparing,
        COUNT(*) FILTER (WHERE status = 'in-transit') as in_transit,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
      FROM shipments
    `;
    const shipmentsStats = await this.executeQuerySingle<{
      total: string;
      preparing: string;
      in_transit: string;
      delivered: string;
      cancelled: string;
    }>(shipmentsStatsQuery);

    return {
      equipment: {
        total: parseInt(equipmentStats?.total || '0'),
        available: parseInt(equipmentStats?.available || '0'),
        in_use: parseInt(equipmentStats?.in_use || '0'),
        maintenance: parseInt(equipmentStats?.maintenance || '0')
      },
      categories: parseInt(categoriesResult?.count || '0'),
      locations: parseInt(locationsResult?.count || '0'),
      stacks: parseInt(stacksResult?.count || '0'),
      shipments: {
        total: parseInt(shipmentsStats?.total || '0'),
        preparing: parseInt(shipmentsStats?.preparing || '0'),
        in_transit: parseInt(shipmentsStats?.in_transit || '0'),
        delivered: parseInt(shipmentsStats?.delivered || '0'),
        cancelled: parseInt(shipmentsStats?.cancelled || '0')
      }
    };
  }

  async getEquipmentStatistics(days: number = 30): Promise<any> {
    const query = `
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '${days} days',
          CURRENT_DATE,
          '1 day'::interval
        )::date as date
      ),
      daily_equipment AS (
        SELECT 
          ds.date,
          COUNT(e.id) as equipment_count,
          COUNT(e.id) FILTER (WHERE e.status = 'available') as available_count,
          COUNT(e.id) FILTER (WHERE e.status = 'in-use') as in_use_count,
          COUNT(e.id) FILTER (WHERE e.status = 'maintenance') as maintenance_count
        FROM date_series ds
        LEFT JOIN equipment e ON e.created_at::date <= ds.date
        GROUP BY ds.date
        ORDER BY ds.date
      )
      SELECT * FROM daily_equipment
    `;

    const dailyStats = await this.executeQuery(query);

    // Статистика по категориям
    const categoryStatsQuery = `
      SELECT 
        c.name,
        COUNT(e.id) as equipment_count
      FROM categories c
      LEFT JOIN equipment e ON c.id = e.category_id
      GROUP BY c.id, c.name
      ORDER BY equipment_count DESC
    `;

    const categoryStats = await this.executeQuery(categoryStatsQuery);

    return {
      daily: dailyStats,
      by_category: categoryStats
    };
  }

  async getShipmentStatistics(days: number = 30): Promise<any> {
    const query = `
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '${days} days',
          CURRENT_DATE,
          '1 day'::interval
        )::date as date
      ),
      daily_shipments AS (
        SELECT 
          ds.date,
          COUNT(s.id) FILTER (WHERE s.created_at::date = ds.date) as created_count,
          COUNT(s.id) FILTER (WHERE s.delivered_at::date = ds.date) as delivered_count,
          COUNT(s.id) FILTER (WHERE s.status = 'preparing' AND s.created_at::date <= ds.date) as preparing_count,
          COUNT(s.id) FILTER (WHERE s.status = 'in-transit' AND s.created_at::date <= ds.date) as in_transit_count
        FROM date_series ds
        LEFT JOIN shipments s ON s.created_at::date <= ds.date
        GROUP BY ds.date
        ORDER BY ds.date
      )
      SELECT * FROM daily_shipments
    `;

    const dailyStats = await this.executeQuery(query);

    // Топ получателей
    const topRecipientsQuery = `
      SELECT 
        recipient,
        COUNT(*) as shipment_count,
        SUM(total_items) as total_items
      FROM shipments
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY recipient
      ORDER BY shipment_count DESC
      LIMIT 10
    `;

    const topRecipients = await this.executeQuery(topRecipientsQuery);

    return {
      daily: dailyStats,
      top_recipients: topRecipients
    };
  }

  async getCategoryStatistics(): Promise<any> {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.description,
        COUNT(e.id) as equipment_count,
        COUNT(e.id) FILTER (WHERE e.status = 'available') as available_count,
        COUNT(e.id) FILTER (WHERE e.status = 'in-use') as in_use_count,
        COUNT(e.id) FILTER (WHERE e.status = 'maintenance') as maintenance_count
      FROM categories c
      LEFT JOIN equipment e ON c.id = e.category_id
      GROUP BY c.id, c.name, c.description
      ORDER BY equipment_count DESC
    `;

    return this.executeQuery(query);
  }

  async getLocationStatistics(): Promise<any> {
    const query = `
      SELECT 
        l.id,
        l.name,
        l.description,
        l.address,
        COUNT(e.id) as equipment_count,
        COUNT(e.id) FILTER (WHERE e.status = 'available') as available_count,
        COUNT(e.id) FILTER (WHERE e.status = 'in-use') as in_use_count,
        COUNT(e.id) FILTER (WHERE e.status = 'maintenance') as maintenance_count
      FROM locations l
      LEFT JOIN equipment e ON l.id = e.location_id
      GROUP BY l.id, l.name, l.description, l.address
      ORDER BY equipment_count DESC
    `;

    return this.executeQuery(query);
  }
}
