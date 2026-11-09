import math
from typing import Dict, Any, List, Optional

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance in kilometers between two points on the earth."""
    # Approximate Earth radius in kilometers
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = R * c
    return round(distance, 1)

def estimate_logistics_cost(distance_km: float, weight_kg: float, category: str = "general") -> Dict[str, Any]:
    """
    Calculate estimated logistics cost based on:
    - Distance (km)
    - Weight (kg)
    - Base mobilization fee
    - Vehicle type suitability
    - Carbon footprint estimate
    """
    base_fee = 40.0
    per_km_rate = 3.5
    per_kg_rate = 0.35

    # Determine recommended vehicle
    if weight_kg <= 100 and distance_km <= 50:
        vehicle_type = "EcoLoop 3W Electric Cargo"
        carbon_factor = 0.05 # kg CO2 per km
        multiplier = 0.9
    elif weight_kg <= 500:
        vehicle_type = "EcoLoop Tata Ace / EV 1-Ton Van"
        carbon_factor = 0.12
        multiplier = 1.0
    elif weight_kg <= 2000:
        vehicle_type = "EcoLoop 407 Medium Commercial Vehicle"
        carbon_factor = 0.28
        multiplier = 1.3
    else:
        vehicle_type = "EcoLoop Multi-Axle Heavy Freight"
        carbon_factor = 0.65
        multiplier = 1.8

    raw_cost = (base_fee + (distance_km * per_km_rate) + (weight_kg * per_kg_rate)) * multiplier
    estimated_cost = max(50.0, round(raw_cost, 0))
    est_duration_mins = max(15, int(round((distance_km / 25.0) * 60 + 15))) # 25 km/h avg urban speed + 15 min loading
    est_transport_co2 = round(distance_km * carbon_factor, 1)

    return {
        "estimated_cost": estimated_cost,
        "vehicle_type": vehicle_type,
        "estimated_duration_mins": est_duration_mins,
        "estimated_transport_co2_kg": est_transport_co2,
        "recommendation": "EcoLoop Green Fleet Logistics" if distance_km > 5 else "Buyer Self-Pickup or Local EcoLoop Courier"
    }

def calculate_environmental_impact(category_name: str, weight_kg: float) -> Dict[str, Any]:
    """Calculate estimated environmental impact factors based on circular economy benchmarks."""
    factors = {
        "Paper/Cardboard": {"co2": 1.4, "water": 26.0, "energy": 4.1, "landfill": 0.001},
        "Cardboard": {"co2": 1.4, "water": 26.0, "energy": 4.1, "landfill": 0.001},
        "Plastic": {"co2": 2.2, "water": 12.0, "energy": 5.8, "landfill": 0.001},
        "Glass": {"co2": 0.8, "water": 4.5, "energy": 2.1, "landfill": 0.001},
        "Metal": {"co2": 4.5, "water": 40.0, "energy": 14.0, "landfill": 0.001},
        "Wood": {"co2": 1.8, "water": 8.0, "energy": 3.0, "landfill": 0.001},
        "Textile": {"co2": 3.6, "water": 120.0, "energy": 9.5, "landfill": 0.001},
        "Food Waste": {"co2": 2.5, "water": 15.0, "energy": 1.5, "landfill": 0.001},
        "Construction Material": {"co2": 0.9, "water": 6.0, "energy": 2.0, "landfill": 0.001},
        "Industrial Scrap": {"co2": 3.8, "water": 35.0, "energy": 11.0, "landfill": 0.001},
        "Furniture": {"co2": 2.1, "water": 18.0, "energy": 5.0, "landfill": 0.001},
        "Equipment": {"co2": 5.2, "water": 45.0, "energy": 16.0, "landfill": 0.001},
        "Packaging": {"co2": 1.6, "water": 22.0, "energy": 4.5, "landfill": 0.001},
    }

    selected = factors.get(category_name, {"co2": 1.5, "water": 20.0, "energy": 4.0, "landfill": 0.001})
    co2_avoided = round(weight_kg * selected["co2"], 1)
    water_saved = round(weight_kg * selected["water"], 1)
    energy_saved = round(weight_kg * selected["energy"], 1)
    waste_diverted_tonnes = round(weight_kg / 1000.0, 3)
    trees_equivalent = round(co2_avoided / 21.0, 2) # 1 tree absorbs ~21kg CO2/year

    return {
        "co2_avoided_kg": co2_avoided,
        "water_saved_liters": water_saved,
        "energy_saved_kwh": energy_saved,
        "waste_diverted_tonnes": waste_diverted_tonnes,
        "trees_equivalent": trees_equivalent
    }

def calculate_ai_match(listing: Dict[str, Any], buyer_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Computes an AI match percentage with a multi-factor score and transparent reasons.
    If buyer_profile is omitted, uses standard circular-economy market demand parameters.
    """
    score = 70.0 # base score
    reasons = []

    # 1. Verification factor
    is_seller_verified = bool(listing.get("is_verified", 0) or listing.get("seller_verified", 0))
    if is_seller_verified:
        score += 8.0
        reasons.append("Verified enterprise seller with authentic business registration")
    else:
        reasons.append("Unverified seller - standard escrow precautions active")

    # 2. Condition factor
    condition = listing.get("condition", "Good")
    if condition in ["New", "Excellent", "Clean & Dry", "Clean"]:
        score += 8.0
        reasons.append(f"High material condition ({condition}) ensures immediate reuse without heavy preprocessing")
    elif condition in ["Good", "Recyclable"]:
        score += 5.0
        reasons.append(f"Readily recyclable grade ({condition}) suitable for standard industrial reprocessing")
    else:
        score -= 5.0
        reasons.append(f"Requires specialized material handling or sorting ({condition})")

    # 3. Distance & Geoproximity
    buyer_lat = buyer_profile.get("lat", 26.1445) if buyer_profile else 26.1445 # default Guwahati/NE India region
    buyer_lng = buyer_profile.get("lng", 91.7362) if buyer_profile else 91.7362

    listing_lat = listing.get("approx_latitude") or listing.get("lat") or 26.1800
    listing_lng = listing.get("approx_longitude") or listing.get("lng") or 91.7500

    distance_km = haversine_distance(buyer_lat, buyer_lng, listing_lat, listing_lng)

    if distance_km < 15.0:
        score += 10.0
        reasons.append(f"Hyper-local radius ({distance_km} km) minimizes transport emissions and transit time")
    elif distance_km < 50.0:
        score += 5.0
        reasons.append(f"Regional proximity ({distance_km} km) within same-day logistics corridor")
    elif distance_km < 200.0:
        score += 0.0
        reasons.append(f"Inter-city proximity ({distance_km} km) - consolidated freight recommended")
    else:
        score -= 8.0
        reasons.append(f"Long-distance shipment ({distance_km} km) - higher transport cost and footprint")

    # 4. Logistics feasibility
    if listing.get("ecoloop_logistics_available", 1):
        score += 5.0
        reasons.append("Integrated EcoLoop verified logistics with live tracking available")

    # 5. Price & Demand Level
    price = listing.get("price_per_unit", 10.0)
    category = listing.get("category_name") or listing.get("category") or "Cardboard"

    # High demand categories in circular economy
    high_demand_categories = ["Cardboard", "Paper/Cardboard", "Metal", "Plastic", "Industrial Scrap", "Equipment", "Wood"]
    if category in high_demand_categories:
        score += 4.0
        demand_level = "High Enterprise Demand"
        reasons.append(f"Strong secondary market demand for {category} resources")
    else:
        demand_level = "Moderate Demand"

    # Granular Subscore Calculations (0-100 scale for UI radar/breakdowns)
    # Proximity subscore
    proximity_subscore = max(20, min(100, int(100 - (distance_km * 0.4))))

    # Condition subscore
    condition_map = {
        "New": 100, "Excellent": 95, "Clean & Dry": 92, "Clean": 90,
        "Good": 80, "Recyclable": 75, "Used": 65, "Processing required": 45, "Damaged": 35
    }
    condition_subscore = condition_map.get(condition, 70)

    # Trust subscore
    seller_rating = float(listing.get("seller_rating", 4.9) or 4.9)
    trust_subscore = int(min(100, (seller_rating / 5.0) * 85 + (15 if is_seller_verified else 0)))

    # Material & Spec subscore
    material_subscore = 92 if category in high_demand_categories else 78

    # Logistics subscore
    logistics_subscore = 95 if listing.get("ecoloop_logistics_available", 1) else 60

    # Overall weighted score
    weighted_score = (
        (material_subscore * 0.25) +
        (proximity_subscore * 0.25) +
        (condition_subscore * 0.20) +
        (trust_subscore * 0.15) +
        (logistics_subscore * 0.15)
    )
    final_score = int(min(98, max(42, round(weighted_score))))

    # Calculate logistics and impact estimates
    qty = float(listing.get("quantity", 50.0))
    logistics_info = estimate_logistics_cost(distance_km, qty, category)
    impact_info = calculate_environmental_impact(category, qty)
    estimated_material_value = round(qty * price, 2)

    # Recommended action based on score
    if final_score >= 88:
        recommended_action = "Priority Request Recommended — Strong compatibility & local availability"
    elif final_score >= 70:
        recommended_action = "Good Opportunity — Evaluate pricing and pickup logistics"
    else:
        recommended_action = "Consider Counter-Offer or Combine with Nearby Orders"

    return {
        "match_percentage": final_score,
        "subscores": {
            "material": material_subscore,
            "proximity": proximity_subscore,
            "condition": condition_subscore,
            "trust": trust_subscore,
            "logistics": logistics_subscore
        },
        "distance_km": distance_km,
        "estimated_value": estimated_material_value,
        "demand_level": demand_level,
        "transportation_estimate": logistics_info["vehicle_type"],
        "estimated_logistics_cost": logistics_info["estimated_cost"],
        "estimated_duration_mins": logistics_info["estimated_duration_mins"],
        "environmental_benefit": f"Diverts {impact_info['waste_diverted_tonnes']} t waste & avoids ~{impact_info['co2_avoided_kg']} kg CO2e",
        "recommended_action": recommended_action,
        "reasons": reasons,
        "impact": impact_info,
        "logistics": logistics_info
    }
