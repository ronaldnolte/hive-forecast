import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/weather_provider.dart';
import '../services/weather_service.dart';
import '../widgets/hexagon_clipper.dart';
import '../widgets/scoring_info_dialog.dart';

class ForecastScreen extends StatefulWidget {
  const ForecastScreen({super.key});

  @override
  State<ForecastScreen> createState() => _ForecastScreenState();
}

class _ForecastScreenState extends State<ForecastScreen> {


  @override
  Widget build(BuildContext context) {
    return Consumer<WeatherProvider>(
      builder: (context, provider, child) {
        final forecast = provider.forecast;
        if (forecast.isEmpty) {
             return Scaffold(
               appBar: AppBar(title: const Text("Hive Forecast"), backgroundColor: Colors.amber), 
               body: const Center(child: CircularProgressIndicator())
             );
        }

        // 1. Pivot Data: Group by Date -> Hour
        // We need to know all unique dates and unique hours.
        final Set<String> uniqueDates = {};
        final Map<String, Map<int, InspectionWindow>> gridData = {};

        for (var w in forecast) {
          final dayStr = DateFormat('yyyy-MM-dd').format(w.startTime);
          uniqueDates.add(dayStr);
          
          if (!gridData.containsKey(dayStr)) {
            gridData[dayStr] = {};
          }
          gridData[dayStr]![w.startTime.hour] = w;
        }

        final sortedDates = uniqueDates.toList()..sort();
        // Fixed slots as defined in service: 6, 8, 10, 12, 14, 16
        final sortedHours = [6, 8, 10, 12, 14, 16]; 

        return Scaffold(
          appBar: AppBar(
            title: Row(
              children: [
                ClipPath(
                  clipper: HexagonClipper(),
                  child: Image.asset('assets/icon.png', height: 40, width: 40, fit: BoxFit.cover),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Hive Forecast', style: TextStyle(fontSize: 18)),
                    Text(provider.locationName, style: const TextStyle(fontSize: 12)),
                  ],
                ),
              ],
            ),
            backgroundColor: Colors.amber,
          ),
          body: Column(
            children: [
              // Legend
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Wrap(
                  spacing: 12,
                  runSpacing: 4,
                  alignment: WrapAlignment.center,
                  children: [
                    _buildLegendItem("Excellent 85+", Colors.green.shade700),
                    _buildLegendItem("Good 70-84", const Color(0xFF00C853)),
                    _buildLegendItem("Fair 55-69", Colors.amber),
                    _buildLegendItem("Poor 40-54", Colors.orange),
                    _buildLegendItem("Not Rec <40", Colors.red),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Row(
                  children: [
                    const Expanded(child: SizedBox()),
                    const Text(
                      "Tap score for details.",
                      style: TextStyle(fontStyle: FontStyle.italic, color: Colors.grey, fontSize: 12),
                    ),
                    Expanded(
                      child: Align(
                        alignment: Alignment.centerRight,
                        child: InkWell(
                          onTap: () => showDialog(context: context, builder: (_) => const ScoringInfoDialog()),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.help_outline, size: 16, color: Colors.grey.shade600),
                              const SizedBox(width: 4),
                              Text("How is this calculated?", style: TextStyle(color: Colors.grey.shade600, fontSize: 12, decoration: TextDecoration.underline)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              
              // The Table
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.vertical,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [

                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Table(
                        defaultColumnWidth: const FixedColumnWidth(60), // Width for data columns
                        border: TableBorder.all(color: Colors.grey.shade300),
                        columnWidths: const {
                          0: FixedColumnWidth(80), // First column (Time Labels) wider
                        },
                        children: [
                          // Header Row (Dates)
                          TableRow(
                            children: [
                              const TableCell(
                                child: Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text("Time", style: TextStyle(fontWeight: FontWeight.bold)),
                                ),
                              ),
                              ...sortedDates.map((dateStr) {
                                final date = DateTime.parse(dateStr);
                                return TableCell(
                                  child: Padding(
                                    padding: const EdgeInsets.all(8.0),
                                    child: Column(
                                      children: [
                                        Text(DateFormat('E').format(date), style: const TextStyle(fontWeight: FontWeight.bold)),
                                        Text(DateFormat('M/d').format(date), style: const TextStyle(fontSize: 10, color: Colors.grey)),
                                      ],
                                    ),
                                  ),
                                );
                              }),
                            ],
                          ),
                          // Data Rows (Hours)
                          ...sortedHours.map((hour) {
                            String timeLabel = _formatHour(hour); // e.g. "6am"
                            
                            return TableRow(
                              children: [
                                // Row Header (Time)
                                TableCell(
                                  verticalAlignment: TableCellVerticalAlignment.middle,
                                  child: Padding(
                                    padding: const EdgeInsets.all(8.0),
                                    child: Text(timeLabel, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                  ),
                                ),
                                // Data Cells
                                ...sortedDates.map((dateStr) {
                                  final window = gridData[dateStr]?[hour];
                                  if (window == null) {
                                      return Container(color: Colors.grey.shade200, height: 50);
                                  }
                                  return _buildTableCell(context, window);
                                }),
                              ],
                            );
                          }),
                        ],
                      ),
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text(
                      "* Days with numbers in red include conditions that are not recommended.",
                      style: TextStyle(color: Colors.red, fontStyle: FontStyle.italic, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ),
            ],
          ),
        );
      },
    );
  }

  String _formatHour(int hour) {
      // 6, 8, 10, 12, 14, 16
      // Ranges: 6-8am, 8-10am, 10-12pm, 12-2pm, 2-4pm, 4-6pm
      // Actually standardizing format: "6-8am", "8-10am", "10am-12pm", "12-2pm", "2-4pm", "4-6pm"
      // User example: "6-8am". 
      
      switch (hour) {
        case 6: return "6-8am";
        case 8: return "8-10am";
        case 10: return "10am-12pm";
        case 12: return "12-2pm";
        case 14: return "2-4pm";
        case 16: return "4-6pm";
        default: return "$hour";
      }
  }
  
  Widget _buildLegendItem(String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12, 
          height: 12, 
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 10)),
      ],
    );
  }

  Widget _buildTableCell(BuildContext context, InspectionWindow window) {
    final color = _getScoreColor(window.score);
    // Text Color logic
    // Text Color logic
    Color textColor = Colors.white;
    List<Shadow> textShadows = [
      const Shadow(blurRadius: 2.0, color: Colors.black45, offset: Offset(1.0, 1.0))
    ];

    if (window.score < 40) {
      // Background is Red. Use Black text to distinguish from "Good".
      textColor = Colors.black;
      textShadows = [];
    } else if (window.issues.isNotEmpty) {
      // Good score/background, but failed condition. Use Red text.
      textColor = Colors.red; 
      textShadows = []; 
    } 

    return InkWell(
      onTap: () => _showDetails(context, window),
      child: Container(
        height: 50, // Fixed height for consistency
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(4),
        ),
        alignment: Alignment.center,
        child: Text(
          window.score.toStringAsFixed(0),
          style: TextStyle(
            color: textColor,
            fontWeight: FontWeight.bold,
            fontSize: 18,
            shadows: textShadows,
          ),
        ),
      ),
    );
  }

  Color _getScoreColor(double score) {
    if (score >= 85) return Colors.green.shade700; // Excellent
    if (score >= 70) return const Color(0xFF00C853); // Good
    if (score >= 55) return Colors.amber; // Fair
    if (score >= 40) return Colors.orange; // Poor
    return Colors.red; // Not Recommended
  }

  void _showDetails(BuildContext context, InspectionWindow window) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return SafeArea(
          child: Align(
            alignment: Alignment.bottomCenter,
            child: ConstrainedBox(
              constraints: const BoxConstraints(
                maxWidth: 450, // Keep it like a phone width even on tablet/landscape
                maxHeight: 700, // Fixed height cap, so it doesn't stretch to fill screen if screen is huge
              ),
              child: Container(
                // In landscape (e.g. height 400), this will take full height relative to screen but constrained by max.
                // Actually height: null allows it to wrap content, but we want scrollable if content is long.
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(context).size.height * 0.9,
                ),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                padding: const EdgeInsets.only(top: 12, left: 24, right: 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                     // 1. Header with Close Button (Fixed)
                    Center(
                      child: Container(
                        width: 40, height: 4, 
                        margin: const EdgeInsets.only(bottom: 20),
                        decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Inspection Conditions', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // 2. Scrollable Content
                    Flexible(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.only(bottom: 40),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                             // Date and Time Info
                            Text(DateFormat('EEEE, MMMM d').format(window.startTime), style: TextStyle(color: Colors.grey.shade600, fontSize: 16)),
                            Text(_formatDetailTime(window.startTime.hour), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
                            const SizedBox(height: 20),

                            // Big Score Banner
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 24),
                              decoration: BoxDecoration(
                                color: _getScoreColor(window.score),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Column(
                                children: [
                                  Text(
                                    window.score.toStringAsFixed(0),
                                    style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: Colors.white),
                                  ),
                                  const Text(
                                    'Overall Score',
                                    style: TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.w500),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),

                            // Stats Grid
                            LayoutBuilder(
                              builder: (context, constraints) {
                                final width = constraints.maxWidth;

                                // Wrap spacing logic: (Width - (cols-1)*spacing) / cols.
                                // 3 cols, 2 spaces. (Width - 24) / 3.
                                final calcWidth = (width - 24) / 3;
                                return Wrap(
                                  spacing: 12,
                                  runSpacing: 12,
                                  children: [
                                    _buildStatCard("Temperature", "${window.tempF.toStringAsFixed(0)}°F", window.scoreBreakdown['Temperature'] ?? 0, 40, calcWidth),
                                    _buildStatCard("Cloud", "${window.cloudCover.toStringAsFixed(0)}%", window.scoreBreakdown['Cloud Cover'] ?? 0, 20, calcWidth),
                                    _buildStatCard("Wind", "${window.windMph.toStringAsFixed(0)}mph", window.scoreBreakdown['Wind Speed'] ?? 0, 20, calcWidth),
                                    _buildStatCard("Precip", "${window.precipProb.toStringAsFixed(0)}%", window.scoreBreakdown['Precipitation'] ?? 0, 15, calcWidth),
                                    _buildStatCard("Humidity", "${window.humidity.toStringAsFixed(0)}%", window.scoreBreakdown['Humidity'] ?? 0, 5, calcWidth),
                                  ],
                                );
                              }
                            ),
                            const SizedBox(height: 24),

                            // New Conditions Summary
                            if (window.issues.isNotEmpty) ...[
                               const Text('Issues:', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 16)),
                               const SizedBox(height: 8),
                               ...window.issues.map((e) => Padding(
                                  padding: const EdgeInsets.only(bottom: 4),
                                  child: Text('• $e', style: TextStyle(color: Colors.grey.shade700, fontSize: 16)),
                                )),
                                const SizedBox(height: 16),
                            ],

                            if (_getPositiveConditions(window).isNotEmpty) ...[
                               const Text('Good Conditions:', 
                                    style: TextStyle(color: Color(0xFF00C853), fontWeight: FontWeight.bold, fontSize: 16)),
                               const SizedBox(height: 8),
                               ..._getPositiveConditions(window).map((s) => Padding(
                                 padding: const EdgeInsets.only(bottom: 4),
                                 child: Text('• $s', style: TextStyle(color: Colors.grey.shade700, fontSize: 16)),
                               )),
                            ],
                            
                            // Conditions Summary (Disabled)
                            if (false && window.issues.isEmpty && window.score > 60) ...[
                               Text(window.score >= 80 ? 'Excellent Conditions:' : 'Good Conditions:', 
                                    style: TextStyle(color: _getScoreColor(window.score), fontWeight: FontWeight.bold, fontSize: 18)),
                               const SizedBox(height: 8),
                               ..._getPositiveConditions(window).map((s) => Padding(
                                 padding: const EdgeInsets.only(bottom: 4),
                                 child: Text('• $s', style: TextStyle(color: Colors.grey.shade700, fontSize: 16)),
                               )),
                            ],
                             if (false && window.issues.isNotEmpty) ...[
                               const Text('Issues Detected:', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 18)),
                               const SizedBox(height: 8),
                               ...window.issues.map((e) => Padding(
                                  padding: const EdgeInsets.only(bottom: 4),
                                  child: Text('• $e', style: const TextStyle(color: Colors.red, fontSize: 16)),
                                )),
                            ],
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
      },
    );
  }

  String _formatDetailTime(int hour) {
      if (hour >= 6 && hour < 10) {
        return "Morning";
      }
      if (hour >= 10 && hour < 14) {
        return "Mid-Day";
      }
      if (hour >= 14 && hour < 17) {
        return "Afternoon";
      }
      return "Evening";
  }

  String _formatTimeWindow(int hour) {
      // Return 10AM-4PM etc
      if (hour >= 10 && hour < 16) {
        return "10AM-4PM";
      }
      return "";
  }

  List<String> _getPositiveConditions(InspectionWindow w) {
      List<String> cond = [];
      if (w.tempF >= 65 && w.tempF <= 85) {
        cond.add("Ideal temperature (${w.tempF.toStringAsFixed(0)}°F)");
      } else if (w.tempF > 55) {
        cond.add("Acceptable temperature (${w.tempF.toStringAsFixed(0)}°F)");
      }
      
      if (w.windMph < 10) {
        cond.add("Light winds (${w.windMph.toStringAsFixed(0)}mph)");
      } else if (w.windMph < 15) {
        cond.add("Manageable winds (${w.windMph.toStringAsFixed(0)}mph)");
      }

      if (w.cloudCover < 30) {
        cond.add("Sunny (${w.cloudCover.toStringAsFixed(0)}% clouds)");
      } else if (w.cloudCover < 60) {
        cond.add("Partly cloudy (${w.cloudCover.toStringAsFixed(0)}% clouds)");
      } else {
        cond.add("Cloudy but flyable");
      }

      if (w.precipProb < 10) {
        cond.add("No rain expected");
      }
      
      return cond;
  }

  Widget _buildStatCard(String label, String value, int score, int maxScore, double width) {
      // Highlights "Failed" conditions (Score 0 for critical metrics)
      bool isFail = score == 0 && label != "Time Bonus";
      
      return Container(
          width: width,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12),
              border: isFail ? Border.all(color: Colors.red, width: 2) : null,
          ),
          child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                  Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black54)),
                  const SizedBox(height: 4),
                  Text(value, style: const TextStyle(fontSize: 12, color: Colors.black87)),
                  const SizedBox(height: 8),
                  Text('$score/$maxScore', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black)),
              ],
          ),
      );
  }
} // End Class
