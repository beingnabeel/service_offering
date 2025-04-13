/**
 * APIFeatures - A query builder utility for Prisma ORM
 * This class provides methods for filtering, sorting, paginating and field selection
 * with built-in error handling for robust operation
 */

// Helper functions for type conversion
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
    "birthDate"
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

/**
 * Class implementing the Builder pattern for constructing Prisma queries
 * Supports an adapter pattern to work with various query builders
 */
class APIFeatures {
  /**
   * @param {Object} query - The Prisma query builder or adapter
   * @param {Object} queryString - Query parameters from request
   */
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  /**
   * Filter the query based on request query parameters
   * Supports all standard Prisma filter operators like gt, lt, contains, etc.
   * @returns {APIFeatures} - Returns this instance for method chaining
   */
  filter() {
    try {
      // Clone the query string object
      const queryObj = { ...this.queryString };
      console.log("Original query object:", queryObj);

      // Define fields to exclude from filtering
      const excludedFields = ["page", "sort", "limit", "fields", "search"];
      excludedFields.forEach((field) => delete queryObj[field]);

      // Process the filter object to create Prisma-compatible where conditions
      const whereConditions = {};

      // Process each filter field - the query builder adapter will handle field validation
      Object.keys(queryObj).forEach((key) => {
        const value = queryObj[key];

        // Handle special filter operators like gt, lt, contains, etc.
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          const fieldConditions = {};
          let hasValidOperator = false;

          // Process each operator (gt, gte, lt, lte, etc.)
          Object.keys(value).forEach((operator) => {
            const operatorValue = value[operator];
            
            // Process known operators
            switch (operator) {
              case "gt":
                fieldConditions.gt = convertValueType(operatorValue, key);
                hasValidOperator = true;
                break;
              case "gte":
                fieldConditions.gte = convertValueType(operatorValue, key);
                hasValidOperator = true;
                break;
              case "lt":
                fieldConditions.lt = convertValueType(operatorValue, key);
                hasValidOperator = true;
                break;
              case "lte":
                fieldConditions.lte = convertValueType(operatorValue, key);
                hasValidOperator = true;
                break;
              case "in":
                // Handle array of values for 'in' operator
                if (Array.isArray(operatorValue)) {
                  fieldConditions.in = operatorValue.map((v) => convertValueType(v, key));
                  hasValidOperator = true;
                }
                break;
              case "contains":
                fieldConditions.contains = operatorValue;
                fieldConditions.mode = "insensitive";
                hasValidOperator = true;
                break;
              case "startsWith":
                fieldConditions.startsWith = operatorValue;
                fieldConditions.mode = "insensitive";
                hasValidOperator = true;
                break;
              case "endsWith":
                fieldConditions.endsWith = operatorValue;
                fieldConditions.mode = "insensitive";
                hasValidOperator = true;
                break;
              case "equals":
                fieldConditions.equals = convertValueType(operatorValue, key);
                hasValidOperator = true;
                break;
              case "not":
                fieldConditions.not = convertValueType(operatorValue, key);
                hasValidOperator = true;
                break;
              default:
                // Ignore unknown operators
                console.log(`Ignoring unknown operator: ${operator}`);
                break;
            }
          });

          // Only add conditions if there's at least one valid operator
          if (hasValidOperator) {
            whereConditions[key] = fieldConditions;
          }
        } 
        // Handle direct value assignments (equality)
        else {
          whereConditions[key] = convertValueType(value, key);
        }
      });

      // Apply the where conditions to the query
      if (Object.keys(whereConditions).length > 0) {
        console.log("Prisma where conditions:", whereConditions);
        this.query = this.query.where(whereConditions);
      }
      
      return this;
    } catch (error) {
      console.error("Error in filter operation:", error);
      // If an error occurs, continue without applying the filter
      return this;
    }
  }

  /**
   * Search across multiple fields using Prisma's OR conditions with contains operator
   * @returns {APIFeatures} - Returns this instance for method chaining
   */
  search() {
    try {
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
                  { landmark: { contains: searchTerm, mode: "insensitive" } }
                ]
              }
            },

            // Service Category related fields
            {
              serviceCenterOfferings: {
                some: {
                  serviceType: {
                    name: { contains: searchTerm, mode: "insensitive" },
                    category: {
                      name: { contains: searchTerm, mode: "insensitive" }
                    }
                  }
                }
              }
            },

            // Vehicle Brand/Model related searches
            {
              serviceCenterOfferings: {
                some: {
                  vehicleBrandServiceOfferings: {
                    some: {
                      brand: {
                        name: { contains: searchTerm, mode: "insensitive" }
                      },
                      model: {
                        name: { contains: searchTerm, mode: "insensitive" }
                      }
                    }
                  }
                }
              }
            },

            // Additional features search
            {
              serviceCenterOfferings: {
                some: {
                  additionalFeatures: {
                    some: {
                      name: { contains: searchTerm, mode: "insensitive" },
                      description: { contains: searchTerm, mode: "insensitive" }
                    }
                  }
                }
              }
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
                          mode: "insensitive"
                        }
                      }
                    }
                  }
                }
              }
            }
          ]
        });
      }
      
      return this;
    } catch (error) {
      console.error("Error in search operation:", error);
      // If search fails, continue without applying the search filter
      return this;
    }
  }

  /**
   * Sort the results based on request query parameters
   * @returns {APIFeatures} - Returns this instance for method chaining
   */
  sort() {
    try {
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
    } catch (error) {
      console.error("Error in sort operation:", error);
      // If sorting fails, continue without sorting
      return this;
    }
  }

  /**
   * Limit fields returned in the result (basic version)
   * @returns {APIFeatures} - Returns this instance for method chaining
   */
  limitFields() {
    try {
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
    } catch (error) {
      console.error("Error in limitFields operation:", error);
      // If field limiting fails, continue without limiting fields
      return this;
    }
  }

  /**
   * Enhanced version that supports nested field selection
   * @returns {APIFeatures} - Returns this instance for method chaining
   */
  limitFieldsAdvanced() {
    try {
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
    } catch (error) {
      console.error("Error in advanced field selection:", error);
      // If field selection fails, continue without limiting fields
      return this;
    }
  }

  /**
   * Paginate results based on page and limit query parameters
   * @returns {APIFeatures} - Returns this instance for method chaining
   */
  paginate() {
    try {
      const page = this.queryString.page * 1 || 1;
      const limit = this.queryString.limit * 1 || 100;
      const skip = (page - 1) * limit;
      console.log("Query string", this.queryString);
      this.query = this.query.skip(skip).limit(limit);

      return this;
    } catch (error) {
      console.error("Error in pagination:", error);
      // If pagination fails, return the query without pagination
      return this;
    }
  }
}

module.exports = APIFeatures;
