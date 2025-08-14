import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { StatisticsModel } from '../models/StatisticsModel';

export class StatisticsController extends BaseController {
  private statisticsModel = new StatisticsModel();

  public getOverall = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.statisticsModel.getOverallStatistics();
      this.success(res, stats);
    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public getEquipmentStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { period = '30' } = req.query;
      const stats = await this.statisticsModel.getEquipmentStatistics(parseInt(period as string));
      this.success(res, stats);
    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public getShipmentStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { period = '30' } = req.query;
      const stats = await this.statisticsModel.getShipmentStatistics(parseInt(period as string));
      this.success(res, stats);
    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public getCategoryStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.statisticsModel.getCategoryStatistics();
      this.success(res, stats);
    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public getLocationStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.statisticsModel.getLocationStatistics();
      this.success(res, stats);
    } catch (error) {
      this.serverError(res, error as Error);
    }
  };
}
