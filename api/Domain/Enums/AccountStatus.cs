namespace api.Domain.Enums;

public enum AccountStatus
{
    Active,           // Normal aktif hesap
    PendingApproval,  // Merchant başvurusu — admin onayı bekliyor
    Rejected,         // Admin tarafından reddedildi
    Suspended,        // Admin tarafından askıya alındı
}
