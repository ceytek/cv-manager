"""
Offer Module - Teklif Yönetimi
"""

from .models import OfferTemplate, Offer
from .enums import OfferStatus, Currency
from .types import (
    OfferTemplateType,
    OfferTemplateInput,
    OfferTemplateResponseType,
    OfferType,
    OfferInput,
    OfferResponseType,
    OfferBenefitType,
    OfferBenefitInput,
    PublicOfferType,
    OfferResponseInput
)
from .resolvers import (
    # Template resolvers
    get_offer_templates,
    get_offer_template,
    create_offer_template,
    update_offer_template,
    delete_offer_template,
    toggle_offer_template,
    # Offer resolvers
    get_offers,
    get_offer,
    get_offer_by_application,
    create_offer,
    update_offer,
    delete_offer,
    send_offer,
    withdraw_offer,
    # Public resolvers
    get_offer_by_token,
    respond_to_offer
)

__all__ = [
    # Models
    'OfferTemplate',
    'Offer',
    # Enums
    'OfferStatus',
    'Currency',
    # Types
    'OfferTemplateType',
    'OfferTemplateInput',
    'OfferTemplateResponseType',
    'OfferType',
    'OfferInput',
    'OfferResponseType',
    'OfferBenefitType',
    'OfferBenefitInput',
    'PublicOfferType',
    'OfferResponseInput',
    # Resolvers
    'get_offer_templates',
    'get_offer_template',
    'create_offer_template',
    'update_offer_template',
    'delete_offer_template',
    'toggle_offer_template',
    'get_offers',
    'get_offer',
    'get_offer_by_application',
    'create_offer',
    'update_offer',
    'delete_offer',
    'send_offer',
    'withdraw_offer',
    'get_offer_by_token',
    'respond_to_offer'
]
