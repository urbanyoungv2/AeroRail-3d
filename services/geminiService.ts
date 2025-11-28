import { GoogleGenAI, Type, Schema } from "@google/genai";
import { TripSummary } from "../types";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

const stationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Full name of the railway station" },
    code: { type: Type.STRING, description: "Official Station Code (e.g. NDLS, CSMT)" },
    lat: { type: Type.NUMBER, description: "Precise latitude" },
    lng: { type: Type.NUMBER, description: "Precise longitude" },
    description: { type: Type.STRING, description: "Brief interesting fact about the city/station" },
    arrivalTime: { type: Type.STRING, description: "Scheduled Arrival Time (24h format)" },
    haltTime: { type: Type.STRING, description: "Halt duration (e.g. '5m', '10m')" },
    platform: { type: Type.STRING, description: "Likely platform number" },
    distanceFromStart: { type: Type.NUMBER, description: "Distance from origin in KM" },
    services: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "Station amenities (e.g. 'Retiring Room', 'Food Plaza', 'WiFi')" 
    },
    operatingHours: { type: Type.STRING, description: "Station active hours" },
    pointsOfInterest: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Nearby tourist attractions"
    }
  },
  required: ["name", "code", "lat", "lng", "description", "arrivalTime", "haltTime", "platform", "distanceFromStart", "services", "operatingHours", "pointsOfInterest"],
};

const tripSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    trainName: { type: Type.STRING, description: "Official Train Name (e.g. Vande Bharat Express)" },
    trainNumber: { type: Type.STRING, description: "Train Number (e.g. 20171)" },
    origin: { type: Type.STRING },
    destination: { type: Type.STRING },
    totalDistanceKm: { type: Type.NUMBER },
    estimatedDuration: { type: Type.STRING },
    stations: {
      type: Type.ARRAY,
      items: stationSchema,
    },
  },
  required: ["trainName", "trainNumber", "origin", "destination", "totalDistanceKm", "estimatedDuration", "stations"],
};

export const searchTrains = async (query: string, type: 'ROUTE' | 'NUMBER'): Promise<TripSummary> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }

  const model = "gemini-2.5-flash";
  
  let prompt = "";
  if (type === 'NUMBER') {
    prompt = `
      Act as the Indian Railways Official API.
      Fetch details for Train Number or Name: "${query}".
      Provide the real-world route, major stations (limit to 12 max for visualization), and schedule.
      Ensure station coordinates are accurate for mapping on India's geography.
    `;
  } else {
    prompt = `
      Act as the Indian Railways Official API.
      Find the best train connection from: "${query}".
      Select the most popular or fastest train for this route.
      Provide the real-world route, major stations (limit to 12 max), and schedule.
      Ensure station coordinates are accurate.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: tripSchema,
        systemInstruction: "You are the central computer for Indian Railways (CRIS). You provide accurate, real-world train schedules, station codes, and route data. You prioritize major junctions and accurate geography.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Rail Network");

    const data = JSON.parse(text) as TripSummary;
    
    // Assign IDs for UI keys
    data.stations = data.stations.map((s, i) => ({ ...s, id: `station-${i}` }));
    
    return data;
  } catch (error) {
    console.error("Rail API Error:", error);
    throw new Error("Unable to connect to Railway Server. Please verify train details.");
  }
};