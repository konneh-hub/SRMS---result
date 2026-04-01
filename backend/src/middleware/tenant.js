// Multi-tenant Middleware
// This middleware checks for a tenant identifier in the request headers
// and attaches it to the request object for use in controllers and models

module.exports = (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

  if (!tenantId) {
    return res.status(400).json({
      error: 'Tenant ID is required. Please provide x-tenant-id header or tenantId query parameter.'
    });
  }

  // Validate tenant ID format (basic validation - can be enhanced)
  if (typeof tenantId !== 'string' || tenantId.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid tenant ID format.'
    });
  }

  // Attach tenant to request object
  req.tenant = {
    id: tenantId.trim(),
    // You can add more tenant-specific data here in the future
    // e.g., database schema, configuration, etc.
  };

  // Also set tenantId for backward compatibility
  req.tenantId = tenantId.trim();

  next();
};