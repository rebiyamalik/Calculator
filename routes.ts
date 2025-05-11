import { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCalculationSchema } from "@shared/schema";
import { ZodError } from "zod";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Route to serve the calculator HTML
  app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), "index.html"));
  });
  
  app.get("/calculator", (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), "index.html"));
  });
  
  // Serve static files for the calculator
  app.get("/styles.css", (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), "styles.css"));
  });
  
  app.get("/script.js", (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), "script.js"));
  });
  // API route for saving a calculation
  app.post("/api/calculations", async (req: Request, res: Response) => {
    try {
      const calculation = insertCalculationSchema.parse(req.body);
      const savedCalculation = await storage.saveCalculation(calculation);
      res.status(201).json(savedCalculation);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // API route for getting recent calculations
  app.get("/api/calculations/recent", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const calculations = await storage.getRecentCalculations(limit);
      res.json(calculations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // API route for getting all calculations
  app.get("/api/calculations", async (req: Request, res: Response) => {
    try {
      const calculations = await storage.getCalculations();
      res.json(calculations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}