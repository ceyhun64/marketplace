namespace api.Domain.Enums;

public enum AccountStatus
{
    Active,          // Standard active account
    PendingApproval, // Merchant application awaiting admin approval
    Rejected,        // Rejected by admin
    Suspended,       // Suspended by admin
}
