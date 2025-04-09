// Helper functions defined outside the class
function convertValueType(value, fieldName) {
  // If value is already not a string, return as is
  if (typeof value !== "string") {
    return value;
  }

  // Convert to boolean if it's 'true' or 'false'
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;

  // Convert to number if it's numeric
  if (!isNaN(value) && value.trim() !== "") {
    // Detect decimal numbers
    if (value.includes(".")) {
      return parseFloat(value);
    }
    return parseInt(value, 10);
  }

  // Handle date conversion for common date fields
  const dateFields = [
    "createdAt",
    "updatedAt",
    "startDate",
    "endDate",
    "date",
    "birthDate",
  ];
  if (
    dateFields.includes(fieldName) ||
    fieldName.endsWith("Date") ||
    fieldName.endsWith("At")
  ) {
    const dateValue = new Date(value);
    if (!isNaN(dateValue.getTime())) {
      return dateValue;
    }
  }

  // Return original string for other cases
  return value;
}

// Process nested filter objects (for relationship filtering)
function processNestedFilter(filterObj) {
  const result = {};

  Object.keys(filterObj).forEach((key) => {
    const value = filterObj[key];

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      // Recursively process nested objects
      result[key] = processNestedFilter(value);
    } else {
      // Handle direct values
      result[key] = convertValueType(value, key);
    }
  });

  return result;
}

// REFACTORING API FEATURES
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // FILTERING - Prisma version
  filter() {
    // Clone the query string object
    const queryObj = { ...this.queryString };
    console.log("Original query object:", queryObj);

    // Define fields to exclude from filtering
    const excludedFields = ["page", "sort", "limit", "fields", "search"];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Process the filter object to create Prisma-compatible where conditions
    const whereConditions = {};

    // Process each filter field
    Object.keys(queryObj).forEach((key) => {
      const value = queryObj[key];

      // Handle special filter operators
      if (typeof value === "object" && value !== null) {
        // Process each operator (gt, gte, lt, lte, etc.)
        Object.keys(value).forEach((operator) => {
          const operatorValue = value[operator];

          switch (operator) {
            case "gt":
              whereConditions[key] = {
                ...whereConditions[key],
                gt: convertValueType(operatorValue, key),
              };
              break;
            case "gte":
              whereConditions[key] = {
                ...whereConditions[key],
                gte: convertValueType(operatorValue, key),
              };
              break;
            case "lt":
              whereConditions[key] = {
                ...whereConditions[key],
                lt: convertValueType(operatorValue, key),
              };
              break;
            case "lte":
              whereConditions[key] = {
                ...whereConditions[key],
                lte: convertValueType(operatorValue, key),
              };
              break;
            case "in":
              // Handle array of values for 'in' operator
              if (Array.isArray(operatorValue)) {
                whereConditions[key] = {
                  ...whereConditions[key],
                  in: operatorValue.map((v) => convertValueType(v, key)),
                };
              }
              break;
            case "contains":
              whereConditions[key] = {
                ...whereConditions[key],
                contains: operatorValue,
                mode: "insensitive",
              };
              break;
            case "startsWith":
              whereConditions[key] = {
                ...whereConditions[key],
                startsWith: operatorValue,
              };
              break;
            case "endsWith":
              whereConditions[key] = {
                ...whereConditions[key],
                endsWith: operatorValue,
              };
              break;
            case "equals":
              whereConditions[key] = {
                ...whereConditions[key],
                equals: convertValueType(operatorValue, key),
              };
              break;
            case "not":
              whereConditions[key] = {
                ...whereConditions[key],
                not: convertValueType(operatorValue, key),
              };
              break;
            // Handle relationship filters
            case "some":
            case "every":
            case "none":
              if (typeof operatorValue === "object") {
                whereConditions[key] = {
                  ...whereConditions[key],
                  [operator]: processNestedFilter(operatorValue),
                };
              }
              break;
          }
        });
      }
      // Handle direct value assignment (equals)
      else {
        whereConditions[key] = convertValueType(value, key);
      }
    });

    console.log("Prisma where conditions:", whereConditions);

    // Only apply the filter if there are actual conditions
    if (Object.keys(whereConditions).length > 0) {
      this.query = this.query.where(whereConditions);
    }

    return this;
  }

  // SEARCH - Prisma version
  search() {
    if (this.queryString.search) {
      const searchTerm = this.queryString.search;
      console.log("Search term:", searchTerm);

      // For Prisma, we need to use OR conditions with contains
      this.query = this.query.where({
        OR: [
          // ServiceCenter related fields
          { name: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
          { phone: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },

          // Brand related fields
          { brand: { name: { contains: searchTerm, mode: "insensitive" } } },

          // Address related fields
          {
            address: {
              OR: [
                { street: { contains: searchTerm, mode: "insensitive" } },
                { city: { contains: searchTerm, mode: "insensitive" } },
                { state: { contains: searchTerm, mode: "insensitive" } },
                { country: { contains: searchTerm, mode: "insensitive" } },
                { postalCode: { contains: searchTerm, mode: "insensitive" } },
                { landmark: { contains: searchTerm, mode: "insensitive" } },
              ],
            },
          },

          // Service Category related fields
          {
            serviceCenterOfferings: {
              some: {
                serviceType: {
                  name: { contains: searchTerm, mode: "insensitive" },
                  category: {
                    name: { contains: searchTerm, mode: "insensitive" },
                  },
                },
              },
            },
          },

          // Vehicle Brand/Model related searches
          {
            serviceCenterOfferings: {
              some: {
                vehicleBrandServiceOfferings: {
                  some: {
                    brand: {
                      name: { contains: searchTerm, mode: "insensitive" },
                    },
                    model: {
                      name: { contains: searchTerm, mode: "insensitive" },
                    },
                  },
                },
              },
            },
          },

          // Additional features search
          {
            serviceCenterOfferings: {
              some: {
                additionalFeatures: {
                  some: {
                    name: { contains: searchTerm, mode: "insensitive" },
                    description: { contains: searchTerm, mode: "insensitive" },
                  },
                },
              },
            },
          },

          // Service packages search
          {
            serviceCenterOfferings: {
              some: {
                servicePackages: {
                  some: {
                    package: {
                      name: { contains: searchTerm, mode: "insensitive" },
                      description: {
                        contains: searchTerm,
                        mode: "insensitive",
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      });
    }
    return this;
  }

  // SORTING - Prisma version
  sort() {
    if (this.queryString.sort) {
      const sortFields = this.queryString.sort.split(",");
      const orderBy = [];

      // Process each sort field
      sortFields.forEach((field) => {
        if (field.startsWith("-")) {
          // Descending order when field has a '-' prefix
          orderBy.push({ [field.substring(1)]: "desc" });
        } else {
          // Ascending order
          orderBy.push({ [field]: "asc" });
        }
      });

      // Apply orderBy to the query
      this.query = this.query.orderBy(orderBy);
      console.log("Sorting by:", orderBy);
    } else {
      // Default sort by createdAt descending
      this.query = this.query.orderBy({ createdAt: "desc" });
    }
    return this;
  }

  // FIELD LIMITATIONS - Prisma version
  limitFields() {
    if (this.queryString.fields) {
      const requestedFields = this.queryString.fields.split(",");
      const select = {};

      // Build select object for Prisma
      requestedFields.forEach((field) => {
        // Handle excluded fields (fields prefixed with -)
        if (field.startsWith("-")) {
          select[field.substring(1)] = false;
        } else {
          select[field] = true;
        }
      });

      // Apply select to the query
      this.query = this.query.select(select);
      console.log("Selected fields:", select);
    }
    return this;
  }

  // Enhanced version that supports nested field selection
  limitFieldsAdvanced() {
    if (this.queryString.fields) {
      const requestedFields = this.queryString.fields.split(",");
      const select = {};

      // Process each field, handling nested paths (e.g., "address.city")
      requestedFields.forEach((fieldPath) => {
        const isExcluded = fieldPath.startsWith("-");
        const path = isExcluded ? fieldPath.substring(1) : fieldPath;
        const pathParts = path.split(".");

        // Handle simple fields
        if (pathParts.length === 1) {
          select[path] = !isExcluded;
        }
        // Handle nested fields
        else {
          let currentLevel = select;

          // Build nested structure
          for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];

            // Last part of the path
            if (i === pathParts.length - 1) {
              // If this is an include/select definition
              if (currentLevel.select) {
                currentLevel.select[part] = !isExcluded;
              } else {
                currentLevel[part] = !isExcluded;
              }
            }
            // Intermediate parts - set up the nested structure
            else {
              if (!currentLevel[part]) {
                currentLevel[part] = { select: {} };
              } else if (!currentLevel[part].select) {
                currentLevel[part].select = {};
              }
              currentLevel = currentLevel[part].select;
            }
          }
        }
      });

      // Always include id unless explicitly excluded
      if (
        select.id !== false &&
        !Object.keys(select).some((k) => select[k] === true)
      ) {
        select.id = true;
      }

      // Apply select to the query
      this.query = this.query.select(select);
      console.log("Advanced selected fields:", select);
    }
    return this;
  }

  // pagination
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    console.log("Query string", this.queryString);
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
