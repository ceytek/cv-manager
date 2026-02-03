"""
Offer Enums
"""

from enum import Enum


class OfferStatus(str, Enum):
    """Teklif durumları"""
    DRAFT = "draft"                         # Taslak
    SENT = "sent"                           # Gönderildi
    ACCEPTED = "accepted"                   # Kabul edildi
    REJECTED = "rejected"                   # Reddedildi
    REVISION_REQUESTED = "revision_requested"  # Revizyon istendi
    REVISED = "revised"                     # Revize edildi
    EXPIRED = "expired"                     # Süresi doldu
    WITHDRAWN = "withdrawn"                 # Geri çekildi


class Currency(str, Enum):
    """Para birimleri"""
    TRY = "TRY"  # Türk Lirası
    USD = "USD"  # Amerikan Doları
    EUR = "EUR"  # Euro
    GBP = "GBP"  # İngiliz Sterlini
