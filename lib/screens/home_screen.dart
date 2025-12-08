import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/weather_provider.dart';
import '../widgets/hexagon_clipper.dart';
import 'forecast_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _zipController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Pre-fill if saved
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final zip = Provider.of<WeatherProvider>(context, listen: false).currentZip;
      if (zip.isNotEmpty) {
        _zipController.text = zip;
      }
    });
  }

  void _getForecast() async {
    final zip = _zipController.text.trim();
    if (zip.isEmpty) return;

    final provider = Provider.of<WeatherProvider>(context, listen: false);
    await provider.fetchForecast(zip);

    if (!mounted) return;

    if (provider.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${provider.error}')),
      );
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const ForecastScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.amber.shade50, // Fallback color
      body: Container(
        decoration: const BoxDecoration(
          image: DecorationImage(
            image: AssetImage('assets/honeycomb.png'),
            repeat: ImageRepeat.repeat,
            opacity: 0.3, // Subtle effect
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // const Icon(Icons.hive, size: 80, color: Colors.amber), // Honeycomb motif
                Center(
                  child: ClipPath(
                    clipper: HexagonClipper(),
                    child: Image.asset('assets/icon.png', height: 120, fit: BoxFit.cover),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Hive Forecast',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.brown,
                    shadows: [Shadow(blurRadius: 2, color: Colors.white, offset: Offset(1,1))], // Ensure text pop on bg
                  ),
                ),
                const SizedBox(height: 40),
                Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 340),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        TextField(
                          controller: _zipController,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            labelText: 'Enter ZIP Code',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            filled: true,
                            fillColor: Colors.white.withOpacity(0.9), // Slightly transparent for bg
                            prefixIcon: const Icon(Icons.location_on),
                          ),
                        ),
                        const SizedBox(height: 20),
                        Consumer<WeatherProvider>(
                          builder: (context, provider, child) {
                            return ElevatedButton(
                              onPressed: provider.isLoading ? null : _getForecast,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.amber,
                                foregroundColor: Colors.black,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: provider.isLoading
                                  ? const CircularProgressIndicator(color: Colors.black)
                                  : const Text('Get Forecast', style: TextStyle(fontSize: 18)),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}


