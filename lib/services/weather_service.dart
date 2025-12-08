import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

class InspectionWindow {
  final DateTime startTime;
  final DateTime endTime;
  final double score;
  final double tempF;
  final double windMph;
  final double cloudCover;
  final double precipProb;
  final double humidity;
  final String condition; // Summary condition
  final List<String> issues; // Kill switch reasons or warnings
  final Map<String, int> scoreBreakdown; // Factor -> Points

  InspectionWindow({
    required this.startTime,
    required this.endTime,
    required this.score,
    required this.tempF,
    required this.windMph,
    required this.cloudCover,
    required this.precipProb,
    required this.humidity,
    required this.condition,
    required this.issues,
    required this.scoreBreakdown,
  });
}

class WeatherService {
  static const String _zipApiUrl = 'https://api.zippopotam.us/us/';
  static const String _weatherApiUrl = 'https://api.open-meteo.com/v1/forecast';

  Future<Map<String, double>> getCoordinates(String zip) async {
    final response = await http.get(Uri.parse('$_zipApiUrl$zip'));
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final lat = double.parse(data['places'][0]['latitude']);
      final lng = double.parse(data['places'][0]['longitude']);
      return {'lat': lat, 'lng': lng};
    } else {
      throw Exception('Invalid ZIP code');
    }
  }

  Future<Map<String, dynamic>> getWeatherForecast(double lat, double lng) async {
    final uri = Uri.parse(
        '$_weatherApiUrl?latitude=$lat&longitude=$lng&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weathercode,cloudcover,windspeed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&forecast_days=14');
    final response = await http.get(uri);
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load weather data');
    }
  }

  List<InspectionWindow> calculateForecast(Map<String, dynamic> weatherData) {
    List<InspectionWindow> windows = [];
    final hourly = weatherData['hourly'];
    final times = hourly['time'] as List;
    final temps = hourly['temperature_2m'] as List;
    final humidities = hourly['relative_humidity_2m'] as List;
    final precipProbs = hourly['precipitation_probability'] as List;
    final precips = hourly['precipitation'] as List;
    final codes = hourly['weathercode'] as List;
    final clouds = hourly['cloudcover'] as List;
    final winds = hourly['windspeed_10m'] as List;

    // Group indices by Date (yyyy-MM-dd)
    Map<String, List<int>> dayIndices = {};
    for (int i = 0; i < times.length; i++) {
        DateTime t = DateTime.parse(times[i]);
        String dayKey = DateFormat('yyyy-MM-dd').format(t);
        if (!dayIndices.containsKey(dayKey)) dayIndices[dayKey] = [];
        dayIndices[dayKey]!.add(i);
    }

    final targetStartHours = [6, 8, 10, 12, 14, 16];

    // Iterate over each day
    for (var dayKey in dayIndices.keys) {
        List<int> indices = dayIndices[dayKey]!;
        
        for (int startHour in targetStartHours) {
            // Find index for this specific hour
            int? startIndex;
            for (int idx in indices) {
                if (DateTime.parse(times[idx]).hour == startHour) {
                    startIndex = idx;
                    break;
                }
            }

            // We need 2 hours of data: startHour and startHour + 1
            if (startIndex != null && (startIndex + 1) < times.length) {
                // Ensure the next hour is actually the next hour (data should be sequential, but good to be safe)
                // Assuming sequential for now as per OpenMeteo spec.
                
                int i = startIndex; 
                // Using 2 data points for 2-hour window
                List<double> segmentTemps = [temps[i], temps[i+1]].map((e) => (e as num).toDouble()).toList();
                List<double> segmentWinds = [winds[i], winds[i+1]].map((e) => (e as num).toDouble()).toList();
                List<double> segmentClouds = [clouds[i], clouds[i+1]].map((e) => (e as num).toDouble()).toList();
                List<double> segmentPrecipProbs = [precipProbs[i], precipProbs[i+1]].map((e) => (e as num).toDouble()).toList();
                List<double> segmentPrecips = [precips[i], precips[i+1]].map((e) => (e as num).toDouble()).toList();
                List<int> segmentCodes = [codes[i], codes[i+1]].map((e) => (e as num).toInt()).toList();
                List<double> segmentHumidities = [humidities[i], humidities[i+1]].map((e) => (e as num).toDouble()).toList();

                // Averages
                double avgTemp = segmentTemps.reduce((a, b) => a + b) / 2;
                double avgWind = segmentWinds.reduce((a, b) => a + b) / 2;
                double avgCloud = segmentClouds.reduce((a, b) => a + b) / 2;
                double avgPrecipProb = segmentPrecipProbs.reduce((a, b) => a + b) / 2;
                double avgHumidity = segmentHumidities.reduce((a, b) => a + b) / 2;

                // Kill Checks (Min/Max)
                double minTemp = segmentTemps.reduce((curr, next) => curr < next ? curr : next);
                double maxWind = segmentWinds.reduce((curr, next) => curr > next ? curr : next);
                double maxPrecipProb = segmentPrecipProbs.reduce((curr, next) => curr > next ? curr : next);
                double maxPrecipRate = segmentPrecips.reduce((curr, next) => curr > next ? curr : next);
                bool hasStorm = segmentCodes.any((c) => [95, 96, 99].contains(c));

                List<String> issues = [];
                if (minTemp < 55) {
                  issues.add("Too Cold (< 55°F)");
                }
                if (maxWind > 24) {
                  issues.add("Too Windy (> 24mph)");
                }
                if (maxPrecipProb > 49) {
                  issues.add("Rain Likely (> 49%)");
                }
                if (maxPrecipRate > 0.02) {
                  issues.add("Raining");
                }
                if (hasStorm) {
                  issues.add("Stormy Weather");
                }

                double totalScore = 0;
                Map<String, int> breakdown = {};

                // Scoring Logic (Always calculate breakdown)
                // Temp (Max 40)
                int tempScore = 0;
                if (avgTemp >= 75) {
                  tempScore = 40;
                } else if (avgTemp >= 70) {
                  tempScore = 37;
                } else if (avgTemp >= 65) {
                  tempScore = 33;
                } else if (avgTemp >= 60) {
                  tempScore = 27;
                } else if (avgTemp >= 57) {
                  tempScore = 18;
                } else if (avgTemp >= 55) {
                  tempScore = 8;
                }
                breakdown['Temperature'] = tempScore;
                totalScore += tempScore;

                // Cloud (Max 20)
                int cloudScore = 0;
                if (avgCloud <= 20) {
                  cloudScore = 20;
                } else if (avgCloud <= 40) {
                  cloudScore = 17;
                } else if (avgCloud <= 60) {
                  cloudScore = 12;
                } else if (avgCloud <= 80) {
                  cloudScore = 6;
                } else {
                  cloudScore = 2;
                }
                breakdown['Cloud Cover'] = cloudScore;
                totalScore += cloudScore;

                // Wind (Max 20)
                int windScore = 0;
                if (avgWind <= 5) {
                  windScore = 20;
                } else if (avgWind <= 10) {
                  windScore = 18;
                } else if (avgWind <= 15) {
                  windScore = 12;
                } else if (avgWind <= 20) {
                  windScore = 6;
                } else if (avgWind <= 24) {
                  windScore = 2;
                }
                breakdown['Wind Speed'] = windScore;
                totalScore += windScore;

                // Precip Prob (Max 15)
                int precipScore = 0;
                if (avgPrecipProb == 0) {
                  precipScore = 15;
                } else if (avgPrecipProb <= 10) {
                  precipScore = 12;
                } else if (avgPrecipProb <= 20) {
                  precipScore = 8;
                } else if (avgPrecipProb <= 35) {
                  precipScore = 4;
                } else if (avgPrecipProb <= 49) {
                  precipScore = 1;
                }
                breakdown['Precipitation'] = precipScore;
                totalScore += precipScore;

                // Humidity (Max 5)
                int humidityScore = (avgHumidity >= 30 && avgHumidity <= 70) ? 5 : 0;
                breakdown['Humidity'] = humidityScore;
                totalScore += humidityScore;

                // Time Bonus Removed from Score
                breakdown['Time Bonus'] = 0; // Keeping key to avoid UI crash if it expects it, or I should update UI. 
                // Better to remove key but updating UI is safer. I will update UI next.
                // Actually, I'll delete the key from breakdown here and handle it in UI.


                // Override total score if kill conditions exist, but keep breakdown
                // if (issues.isNotEmpty) {
                //     totalScore = 0;
                // }

                windows.add(InspectionWindow(
                  startTime: DateTime.parse(times[i]),
                  endTime: DateTime.parse(times[i]).add(Duration(hours: 2)), // 2 hour window
                  score: totalScore,
                  tempF: avgTemp,
                  windMph: avgWind,
                  cloudCover: avgCloud,
                  precipProb: avgPrecipProb,
                  humidity: avgHumidity,
                  condition: _getConditionCode(segmentCodes[0]),
                  issues: issues,
                  scoreBreakdown: breakdown,
                ));
            }
        }
    }
    return windows;
  }
  
  String _getConditionCode(int code) {
      // WMO codes
      if (code == 0) return 'Clear';
      if (code <= 3) return 'Partly Cloudy';
      if (code <= 48) return 'Foggy';
      if (code <= 67) return 'Rainy';
      if (code <= 77) return 'Snowy';
      if (code <= 82) return 'Rain Showers';
      return 'Stormy';
  }
}
