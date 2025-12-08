import 'package:flutter/material.dart';

class HexagonClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    final path = Path();
    final w = size.width;
    final h = size.height;
    
    // Regular Hexagon Aspect Ratio (Flat-topped): Height = Width * (sqrt(3)/2) approx 0.866
    // We constrain by width, so calculate the correct height for a regular hex.
    final hexH = w * 0.866025; 
    final top = (h - hexH) / 2;
    final bottom = top + hexH;
    final cy = h / 2;

    path.moveTo(w * 0.25, top);
    path.lineTo(w * 0.75, top);
    path.lineTo(w, cy);
    path.lineTo(w * 0.75, bottom);
    path.lineTo(w * 0.25, bottom);
    path.lineTo(0, cy);
    path.close();
    return path;
  }

  @override
  bool shouldReclip(CustomClipper<Path> oldClipper) => false;
}
