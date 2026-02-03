"""
Benefit Enums
"""

from enum import Enum


class BenefitCategory(str, Enum):
    """Yan hak kategorileri"""
    FINANCIAL = "financial"      # Finansal
    HEALTH = "health"            # Sağlık
    TRANSPORTATION = "transportation"  # Ulaşım
    DEVELOPMENT = "development"  # Gelişim
    LIFESTYLE = "lifestyle"      # Yaşam Tarzı
    FOOD = "food"                # Yemek


class ValuePeriod(str, Enum):
    """Değer periyodu"""
    DAILY = "daily"      # Günlük
    MONTHLY = "monthly"  # Aylık
    YEARLY = "yearly"    # Yıllık


# Category colors for UI
CATEGORY_COLORS = {
    BenefitCategory.FINANCIAL: "#3B82F6",      # Blue
    BenefitCategory.HEALTH: "#10B981",         # Green
    BenefitCategory.TRANSPORTATION: "#F97316", # Orange
    BenefitCategory.DEVELOPMENT: "#8B5CF6",    # Purple
    BenefitCategory.LIFESTYLE: "#EAB308",      # Yellow
    BenefitCategory.FOOD: "#EF4444",           # Red
}

# Category icons
CATEGORY_ICONS = {
    BenefitCategory.FINANCIAL: "💰",
    BenefitCategory.HEALTH: "🏥",
    BenefitCategory.TRANSPORTATION: "🚗",
    BenefitCategory.DEVELOPMENT: "📚",
    BenefitCategory.LIFESTYLE: "🏃",
    BenefitCategory.FOOD: "🍽️",
}
