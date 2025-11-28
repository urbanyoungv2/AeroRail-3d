import { GoogleGenAI, Type, Schema } from "@google/genai";
import { TripSummary } from "../types";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

const stationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Name of the train station" },
    lat: { type: Type.NUMBER, description: "Latitude of the station" },
    lng: { type: Type.NUMBER, description: "Longitude of the station" },
    description: { type: Type.STRING, description: "A short, futuristic or historical interesting fact about this location" },
    arrivalTime: { type: Type.STRING, description: "Estimated arrival time relative to start (e.g., '+2h 30m')" },
    distanceFromStart: { type: Type.NUMBER, description: "Distance from the origin station in kilometers" },
  },
  required: ["name", "lat", "lng", "description", "arrivalTime", "distanceFromStart"],
};

const tripSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    origin: { type: Type.STRING },
    destination: { type: Type.STRING },
    totalDistanceKm: { type: Type.NUMBER },
    estimatedDuration: { type: Type.STRING },
    stations: {
      type: Type.ARRAY,
      items: stationSchema,
    },
  },
  required: ["origin", "destination", "totalDistanceKm", "estimatedDuration", "stations"],
};

export const generateTrip = async (origin: string, destination: string): Promise<TripSummary> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }

  const model = "gemini-2.5-flash";
  const prompt = `
    Plan a detailed train trip itinerary from ${origin} to ${destination}.
    Include between 4 to 10 stops (stations) including the start and end.
    For each station, provide accurate approximate coordinates.
    The description should be engaging.
    Calculate cumulative distances.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: tripSchema,
        systemInstruction: "You are an expert travel planner with a focus on railway journeys.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text) as TripSummary;
    
    // Assign IDs for UI keys
    data.stations = data.stations.map((s, i) => ({ ...s, id: `station-${i}` }));
    
    return data;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate trip plan. Please try again.");
  }
};
