import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/weather_service.dart';

class WeatherProvider with ChangeNotifier {
  final WeatherService _service = WeatherService();
  
  List<InspectionWindow> _forecast = [];
  bool _isLoading = false;
  String? _error;
  String _currentZip = '';
  String _locationName = ''; // e.g. City name if available, for now just reuse zip or maybe get Place name

  List<InspectionWindow> get forecast => _forecast;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get currentZip => _currentZip;
  String get locationName => _locationName;

  WeatherProvider() {
    _loadSavedZip();
  }

  Future<void> _loadSavedZip() async {
    final prefs = await SharedPreferences.getInstance();
    _currentZip = prefs.getString('saved_zip') ?? '';
    notifyListeners();
  }

  Future<void> fetchForecast(String zip) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final coords = await _service.getCoordinates(zip);
      final weatherData = await _service.getWeatherForecast(coords['lat']!, coords['lng']!);
      _forecast = _service.calculateForecast(weatherData);
      
      _currentZip = zip;
      _locationName = "Zip: $zip"; // We could get city name from Zippopotam response if we parsed it.
      
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('saved_zip', zip);
      
    } catch (e) {
      _error = e.toString();
      _forecast = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
