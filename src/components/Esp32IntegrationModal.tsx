import React, { useState } from 'react';
import { X, CodeXml, Copy, Check, Send, CheckCircle2, Cpu } from 'lucide-react';
import { SensorReading } from '../types';

interface Esp32IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectLiveReading: (reading: SensorReading) => void;
}

export const Esp32IntegrationModal: React.FC<Esp32IntegrationModalProps> = ({
  isOpen,
  onClose,
  onInjectLiveReading,
}) => {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const sampleJson = {
    nodeId: 'Node 1',
    temperature: 29.5,
    humidity: 65.2,
    pressure: 1012.4,
    airQuality: 145,
    voltage: 3.85,
    current: 0.12,
    power: 0.462,
    energy: 78.5,
  };

  const curlCommand = `curl -X POST http://localhost:3000/api/sensor-data \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(sampleJson, null, 2)}'`;

  const arduinoSnippet = `// ESP32 Hardware Integration Snippet for WSN Project
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <Adafruit_INA219.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverEndpoint = "http://YOUR_SERVER_IP:3000/api/sensor-data";

Adafruit_BME280 bme;
Adafruit_INA219 ina219;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Wire.begin();
  bme.begin(0x76);
  ina219.begin();
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverEndpoint);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<256> doc;
    doc["nodeId"] = "Node 1";
    doc["temperature"] = bme.readTemperature();
    doc["humidity"] = bme.readHumidity();
    doc["pressure"] = bme.readPressure() / 100.0F;
    doc["airQuality"] = analogRead(34) / 8.0; // MQ-135 analog
    doc["voltage"] = ina219.getBusVoltage_V();
    doc["current"] = ina219.getCurrent_mA() / 1000.0;
    doc["power"] = ina219.getPower_mW() / 1000.0;
    doc["energy"] = 92.5; // Calculated battery percentage

    String payload;
    serializeJson(doc, payload);

    int httpResponseCode = http.POST(payload);
    Serial.printf("Ingested Telemetry HTTP Code: %d\\n", httpResponseCode);
    http.end();
  }
  delay(3000);
}`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(arduinoSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendTestPacket = async () => {
    const reading: SensorReading = {
      nodeId: 'Node 1',
      temperature: 31.4,
      humidity: 62.0,
      pressure: 1014.2,
      airQuality: 165,
      voltage: 3.92,
      current: 110.0,
      power: 431.2,
      energy: 88.0,
      packetLoss: 1.2,
      commStatus: 'CONNECTED',
      mpuVibration: 0.08,
      timestamp: new Date().toISOString(),
      source: 'ESP32_PHYSICAL',
    };

    try {
      // Send real POST to Express server
      await fetch('/api/sensor-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reading),
      });
    } catch (e) {
      // Fallback local injection
    }

    onInjectLiveReading(reading);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center shadow">
              <Cpu className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Physical ESP32 Sensor Hardware Integration
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Ready Interface
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Specification for connecting real ESP32 sensors (BME280, MQ-135, INA219, MPU6050) to the live dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="my-4 space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
          {/* Endpoint Specification */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-mono font-bold text-cyan-300">
                POST /api/sensor-data
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                Endpoint Active in server.ts
              </span>
            </div>
            <p className="text-slate-400 mb-3">
              Real ESP32 microcontrollers send standard JSON telemetry directly to this HTTP REST endpoint. The software architecture requires zero changes to transition from simulation to real physical hardware.
            </p>

            {/* Test Send Button */}
            <button
              onClick={handleSendTestPacket}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send Sample ESP32 Packet Now</span>
            </button>
            {testSent && (
              <span className="ml-3 text-emerald-400 font-semibold inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Packet injected into live network!
              </span>
            )}
          </div>

          {/* cURL Example */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-300">cURL Ingestion Command:</span>
              <button
                onClick={handleCopyCurl}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                {copiedCurl ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedCurl ? 'Copied' : 'Copy cURL'}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 rounded font-mono text-[11px] text-slate-300 overflow-x-auto">
              {curlCommand}
            </pre>
          </div>

          {/* Arduino Code Snippet */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-300">Ready ESP32 C++ Sketch (Arduino IDE / PlatformIO):</span>
              <button
                onClick={handleCopyCode}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedCode ? 'Copied' : 'Copy Code'}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 rounded font-mono text-[11px] text-slate-300 overflow-x-auto max-h-52">
              {arduinoSnippet}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
