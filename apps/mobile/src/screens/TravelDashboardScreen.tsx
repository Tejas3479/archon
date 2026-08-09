import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useAtom } from "jotai";
import { ArchonBridge } from "../services/ArchonBridge";
import { travelStateAtom } from "../store";

export default function TravelDashboardScreen() {
  const [travelState, setTravelState] = useAtom(travelStateAtom);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (destination: string) => {
    setLoading(true);
    try {
      const vars = JSON.stringify({ action: "search_flights", destination });
      const resStr = await ArchonBridge.travelProcessIntent(vars);
      const res = JSON.parse(resStr);
      setTravelState((prev) => ({
        ...prev,
        flights: res.flights || [],
      }));
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to search flights");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    setLoading(true);
    try {
      const vars = JSON.stringify({ action: "auto_checkin", booking_reference: "REF-AA234" });
      const resStr = await ArchonBridge.travelProcessIntent(vars);
      const res = JSON.parse(resStr);
      if (res.checkin_successful) {
        setTravelState((prev) => ({
          ...prev,
          checkins: [
            ...prev.checkins,
            {
              booking_reference: res.booking_reference,
              seat: res.seat,
              boarding_pass_url: res.boarding_pass_url,
            },
          ],
        }));
        Alert.alert("Check-in Complete", res.message);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to check-in");
    } finally {
      setLoading(false);
    }
  };

  const handlePriceCheck = async () => {
    setLoading(true);
    try {
      const vars = JSON.stringify({
        action: "monitor_price_drop",
        destination: "New York",
        original_price: 350.00,
      });
      const resStr = await ArchonBridge.travelProcessIntent(vars);
      const res = JSON.parse(resStr);
      if (res.price_drop_detected) {
        setTravelState((prev) => ({
          ...prev,
          priceAlerts: [...prev.priceAlerts, res.message],
        }));
      } else {
        Alert.alert("Price Check", res.message);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to run price monitor");
    } finally {
      setLoading(false);
    }
  };

  const clearState = () => {
    setTravelState({ flights: [], priceAlerts: [], checkins: [] });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Travel Concierge Agent</Text>
        <Text style={styles.subtitle}>Proactive Monitoring, Bookings & Check-ins</Text>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleSearch("New York")}>
          <Text style={styles.buttonText}>Search NYC</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handlePriceCheck}>
          <Text style={styles.buttonText}>Price Audit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleCheckin}>
          <Text style={styles.buttonText}>Auto Check-in</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="small" color="#3b82f6" style={styles.loader} />}

      {/* Price Alert Banners */}
      {travelState.priceAlerts.map((alert, idx) => (
        <View key={`alert-${idx}`} style={styles.alertBanner}>
          <Text style={styles.alertTitle}>💰 Price Reduction Found</Text>
          <Text style={styles.alertText}>{alert}</Text>
          <TouchableOpacity
            style={styles.rebookBtn}
            onPress={() => Alert.alert("Rebook Confirmation", "Are you sure you want to execute rebooking? The refund will be credited back in 2-3 business days.", [
              { text: "Cancel", style: "cancel" },
              { text: "Confirm", onPress: () => Alert.alert("Success", "Rebooking processed! Refund has been initiated.") }
            ])}
          >
            <Text style={styles.rebookBtnText}>Auto-Rebook Now</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Flight Search Results */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monitored Flights</Text>
        {travelState.flights.length === 0 ? (
          <Text style={styles.emptyText}>No active flight searches.</Text>
        ) : (
          travelState.flights.map((flight, idx) => (
            <View key={`flight-${idx}`} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{flight.airline} ({flight.flight_no})</Text>
                <Text style={styles.cardPrice}>${flight.price}</Text>
              </View>
              <Text style={styles.cardDetail}>Destination: {flight.destination}</Text>
              <Text style={styles.cardStatus}>🟢 Monitoring price adjustments</Text>
            </View>
          ))
        )}
      </View>

      {/* Boarding Passes / Active Checkins */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Boarding Passes & Check-ins</Text>
        {travelState.checkins.length === 0 ? (
          <Text style={styles.emptyText}>No active check-ins or boarding passes.</Text>
        ) : (
          travelState.checkins.map((ch, idx) => (
            <View key={`ch-${idx}`} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Booking Ref: {ch.booking_reference}</Text>
                <Text style={styles.seatBadge}>Seat {ch.seat}</Text>
              </View>
              <Text style={styles.cardDetail}>Boarding pass generated successfully.</Text>
              <TouchableOpacity
                style={styles.passBtn}
                onPress={() => Linking.openURL(ch.boarding_pass_url).catch(() => Alert.alert("Open Boarding Pass", `Opening mock URL: ${ch.boarding_pass_url}`))}
              >
                <Text style={styles.passBtnText}>📄 View Boarding Pass PDF</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Reset button */}
      {(travelState.flights.length > 0 || travelState.priceAlerts.length > 0 || travelState.checkins.length > 0) && (
        <TouchableOpacity style={styles.resetBtn} onPress={clearState}>
          <Text style={styles.resetText}>Reset Dashboard</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: "#f3f4f6",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#1f2937",
    borderWidth: 1,
    borderColor: "#374151",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  loader: {
    marginVertical: 12,
  },
  alertBanner: {
    backgroundColor: "#7c2d12",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#9a3412",
    marginBottom: 20,
  },
  alertTitle: {
    color: "#ffedd5",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  alertText: {
    color: "#fed7aa",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  rebookBtn: {
    backgroundColor: "#ea580c",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  rebookBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#60a5fa",
    fontSize: 15,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.05,
    marginBottom: 10,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 13,
    fontStyle: "italic",
    paddingVertical: 10,
  },
  card: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: {
    color: "#f3f4f6",
    fontSize: 14,
    fontWeight: "600",
  },
  cardPrice: {
    color: "#10b981",
    fontSize: 14,
    fontWeight: "700",
  },
  cardDetail: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 6,
  },
  cardStatus: {
    color: "#3b82f6",
    fontSize: 12,
    fontWeight: "500",
  },
  seatBadge: {
    backgroundColor: "#1e3a8a",
    color: "#93c5fd",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  passBtn: {
    backgroundColor: "#1f2937",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: "center",
    marginTop: 8,
  },
  passBtnText: {
    color: "#f3f4f6",
    fontSize: 12,
    fontWeight: "600",
  },
  resetBtn: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  resetText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 13,
  },
});
