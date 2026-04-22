namespace api.Common.DTOs;

public class OrderDto
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string ShippingRate { get; set; } = string.Empty;
    public string? PaymentId { get; set; }
    public ShippingAddressDto ShippingAddress { get; set; } = new();
    public List<OrderItemDto> Items { get; set; } = new();
    public ShipmentSummaryDto? Shipment { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class OrderItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; } // OfferId → ProductId
    public Guid MerchantId { get; set; } // yeni eklendi
    public string ProductName { get; set; } = string.Empty;
    public string? ProductImageUrl { get; set; }
    public string MerchantStoreName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal SubTotal { get; set; }
}

public class CreateOrderItemDto
{
    public Guid ProductId { get; set; } // OfferId → ProductId
    public int Quantity { get; set; }
}

public class ShippingAddressDto
{
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
}

public class ShipmentSummaryDto
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string TrackingNumber { get; set; } = string.Empty;
    public DateTime? EstimatedDelivery { get; set; }
    public string? LabelUrl { get; set; }
}

public class CreateOrderDto
{
    public List<CreateOrderItemDto> Items { get; set; } = new();
    public ShippingAddressDto ShippingAddress { get; set; } = new();
    public string ShippingRate { get; set; } = "Regular";
    public string Source { get; set; } = "Marketplace";
}

public class UpdateOrderStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public class CancelOrderDto
{
    public string Reason { get; set; } = string.Empty;
}

public class TrackingHistoryItemDto
{
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime Timestamp { get; set; }
}

public class EtaResponseDto
{
    public int EstimatedHours { get; set; }
    public DateTime EstimatedDeliveryDate { get; set; }
    public double DistanceKm { get; set; }
    public string ShippingRate { get; set; } = string.Empty;
}

public class OrderItemRequestDto
{
    public Guid OfferId { get; set; }
    public int Quantity { get; set; }
}

public class OrderTrackingDto
{
    public Guid OrderId { get; set; }
    public string OrderStatus { get; set; } = string.Empty;
    public string? TrackingNumber { get; set; }
    public string? ShipmentStatus { get; set; }
    public DateTime? EstimatedDelivery { get; set; }
    public string? LabelUrl { get; set; } // ✅ eklendi
    public string? CourierName { get; set; }
    public string? CourierPhone { get; set; }
    public List<ShipmentStatusHistoryDto> StatusHistory { get; set; } = new(); // ✅ güncellendi
}
