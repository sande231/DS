import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FRAME_WIDTH = SCREEN_WIDTH * 0.85;
const FRAME_HEIGHT = SCREEN_HEIGHT * 0.45;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

interface CameraGuideProps {
  hint?: string;
}

export default function CameraGuide({
  hint = 'Align document within the frame',
}: CameraGuideProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Top dark overlay */}
      <View style={[styles.overlay, styles.overlayTop]} />

      {/* Middle row */}
      <View style={styles.middleRow}>
        {/* Left dark overlay */}
        <View style={[styles.overlay, styles.overlaySide]} />

        {/* Document guide frame */}
        <View style={styles.frame}>
          {/* Top-left corner */}
          <View style={[styles.corner, styles.cornerTopLeft]}>
            <View style={[styles.cornerH, { top: 0, left: 0 }]} />
            <View style={[styles.cornerV, { top: 0, left: 0 }]} />
          </View>

          {/* Top-right corner */}
          <View style={[styles.corner, styles.cornerTopRight]}>
            <View style={[styles.cornerH, { top: 0, right: 0 }]} />
            <View style={[styles.cornerV, { top: 0, right: 0 }]} />
          </View>

          {/* Bottom-left corner */}
          <View style={[styles.corner, styles.cornerBottomLeft]}>
            <View style={[styles.cornerH, { bottom: 0, left: 0 }]} />
            <View style={[styles.cornerV, { bottom: 0, left: 0 }]} />
          </View>

          {/* Bottom-right corner */}
          <View style={[styles.corner, styles.cornerBottomRight]}>
            <View style={[styles.cornerH, { bottom: 0, right: 0 }]} />
            <View style={[styles.cornerV, { bottom: 0, right: 0 }]} />
          </View>
        </View>

        {/* Right dark overlay */}
        <View style={[styles.overlay, styles.overlaySide]} />
      </View>

      {/* Bottom dark overlay */}
      <View style={[styles.overlay, styles.overlayBottom]}>
        {/* Hint text */}
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>{hint}</Text>
          <Text style={styles.hintSubtext}>Hold steady · Ensure good lighting · Avoid shadows</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  overlayTop: {
    width: SCREEN_WIDTH,
    height: (SCREEN_HEIGHT - FRAME_HEIGHT) / 2 - 20,
  },
  overlayBottom: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 16,
  },
  overlaySide: {
    width: (SCREEN_WIDTH - FRAME_WIDTH) / 2,
    height: FRAME_HEIGHT,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  frame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
  },
  cornerH: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_THICKNESS,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  cornerV: {
    position: 'absolute',
    width: CORNER_THICKNESS,
    height: CORNER_SIZE,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  hintContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  hintText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  hintSubtext: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    textAlign: 'center',
  },
});
