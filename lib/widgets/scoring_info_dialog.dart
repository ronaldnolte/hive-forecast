import 'package:flutter/material.dart';

class ScoringInfoDialog extends StatelessWidget {
  const ScoringInfoDialog({super.key});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 600, maxHeight: 800),
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Scoring Formula', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.of(context).pop()),
              ],
            ),
            const Divider(),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 16),
                    _buildSectionHeader("Automatic Fail Conditions (Score = 0)", Colors.red),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        border: Border.all(color: Colors.red.shade200),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("If any of these conditions are met, the score is automatically 0:", style: TextStyle(fontWeight: FontWeight.w600)),
                          SizedBox(height: 8),
                          Text("• Temperature < 55°F"),
                          Text("• Wind Speed > 24 mph"),
                          Text("• Precipitation Probability > 49%"),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    _buildSectionHeader("Scoring Breakdown (Max 100 Points)", Colors.brown),
                    const SizedBox(height: 16),
                    _buildCategory("1. Temperature", "Max 40 pts", [
                      _buildRow("≥ 75°F", "40 pts"),
                      _buildRow("70–74°F", "37 pts"),
                      _buildRow("65–69°F", "33 pts"),
                      _buildRow("60–64°F", "27 pts"),
                      _buildRow("57–59°F", "18 pts"),
                      _buildRow("55–56°F", "8 pts"),
                      _buildRow("< 55°F", "0 pts (Fail)"),
                    ]),
                    _buildCategory("2. Cloud Cover", "Max 20 pts", [
                      _buildRow("0–20%", "20 pts"),
                      _buildRow("21–40%", "17 pts"),
                      _buildRow("41–60%", "12 pts"),
                      _buildRow("61–80%", "6 pts"),
                      _buildRow("81–100%", "2 pts"),
                    ]),
                    _buildCategory("3. Wind Speed", "Max 20 pts", [
                      _buildRow("0–5 mph", "20 pts"),
                      _buildRow("6–10 mph", "18 pts"),
                      _buildRow("11–15 mph", "12 pts"),
                      _buildRow("16–20 mph", "6 pts"),
                      _buildRow("21–24 mph", "2 pts"),
                      _buildRow("> 24 mph", "0 pts (Fail)"),
                    ]),
                    _buildCategory("4. Precipitation Probability", "Max 15 pts", [
                      _buildRow("0%", "15 pts"),
                      _buildRow("1–10%", "12 pts"),
                      _buildRow("11–20%", "8 pts"),
                      _buildRow("21–35%", "4 pts"),
                      _buildRow("36–49%", "1 pts"),
                      _buildRow("> 49%", "0 pts (Fail)"),
                    ]),
                    _buildCategory("5. Humidity", "Max 5 pts", [
                      _buildRow("30–70%", "5 pts"),
                      _buildRow("Else", "0 pts"),
                    ]),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.brown, foregroundColor: Colors.white),
                onPressed: () => Navigator.of(context).pop(), 
                child: const Text("Close"),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, Color color) {
    return Text(title, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.bold));
  }

  Widget _buildCategory(String title, String badge, List<Widget> rows) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: Colors.amber.shade100, borderRadius: BorderRadius.circular(4)),
              child: Text(badge, style: TextStyle(color: Colors.brown.shade800, fontWeight: FontWeight.bold, fontSize: 12)),
            )
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade300),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(children: rows),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildRow(String label, String points) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 14)),
          Text(points, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
