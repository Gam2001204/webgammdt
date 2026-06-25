// Generate the 3 roles for a business
export const getBusinessRoles = (businessNombre) => [
  businessNombre,
  `Empleado ${businessNombre}`,
  `Jefe ${businessNombre}`,
];

// Check if user has admin role
export const isAdmin = (userProfile) => userProfile?.esAdmin === true || userProfile?.roles?.includes("admin");

// Check if user is boss of a specific business
export const isJefeOf = (userProfile, businessNombre) =>
  userProfile?.roles?.includes(`Jefe ${businessNombre}`);

// Check if user is employee of a specific business
export const isEmpleadoOf = (userProfile, businessNombre) =>
  userProfile?.roles?.includes(businessNombre) ||
  userProfile?.roles?.includes(`Empleado ${businessNombre}`) ||
  userProfile?.roles?.includes(`Jefe ${businessNombre}`);

// Get all businesses the user has access to
export const getUserBusinesses = (userProfile, businesses) => {
  if (!businesses) return [];
  if (isAdmin(userProfile)) return businesses;
  return businesses.filter((b) => isEmpleadoOf(userProfile, b.nombre));
};

// Check if user can access a specific business section
export const canAccessBusiness = (userProfile, businessNombre) =>
  isAdmin(userProfile) || isEmpleadoOf(userProfile, businessNombre);