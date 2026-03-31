const universityRepository = require('../repositories/universityRepository');
const userRepository = require('../repositories/userRepository');
const authService = require('./authService');
const { isValidEmail, sanitizeInput } = require('../utils/helpers');

class UniversityService {
  async getAllUniversities(tenantId, universityId = null, options = {}) {
    try {
      const universities = await universityRepository.findAll(tenantId, universityId, options);
      return {
        success: true,
        data: universities,
        count: universities.length
      };
    } catch (error) {
      throw new Error(`Failed to fetch universities: ${error.message}`);
    }
  }

  async getUniversityById(id, tenantId) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid university ID');
      }

      const university = await universityRepository.findById(id, tenantId);
      if (!university) {
        throw new Error('University not found');
      }

      return {
        success: true,
        data: university
      };
    } catch (error) {
      throw error;
    }
  }

  async createUniversity(universityData, tenantId) {
    try {
      // Validate required fields
      if (!universityData.name || !universityData.name.trim()) {
        throw new Error('University name is required');
      }

      // Check for duplicate name
      const existingUniversity = await universityRepository.findByName(
        universityData.name.trim(),
        tenantId
      );
      if (existingUniversity) {
        throw new Error('A university with this name already exists');
      }

      // Sanitize and prepare data
      const data = {
        name: sanitizeInput(universityData.name),
        location: universityData.location ? sanitizeInput(universityData.location) : null,
        established_year: universityData.established_year ? parseInt(universityData.established_year) : null
      };

      // Validate established year
      if (data.established_year && (data.established_year < 1000 || data.established_year > new Date().getFullYear())) {
        throw new Error('Invalid established year');
      }

      const university = await universityRepository.create(data, tenantId);
      return {
        success: true,
        data: university,
        message: 'University created successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async updateUniversity(id, universityData, tenantId) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid university ID');
      }

      // Check if university exists
      const existingUniversity = await universityRepository.findById(id, tenantId);
      if (!existingUniversity) {
        throw new Error('University not found');
      }

      // Check for duplicate name if name is being updated
      if (universityData.name && universityData.name.trim() !== existingUniversity.name) {
        const duplicateUniversity = await universityRepository.findByName(
          universityData.name.trim(),
          tenantId
        );
        if (duplicateUniversity) {
          throw new Error('A university with this name already exists');
        }
      }

      // Prepare update data
      const data = {};
      if (universityData.name !== undefined) {
        data.name = sanitizeInput(universityData.name);
      }
      if (universityData.location !== undefined) {
        data.location = universityData.location ? sanitizeInput(universityData.location) : null;
      }
      if (universityData.established_year !== undefined) {
        data.established_year = universityData.established_year ? parseInt(universityData.established_year) : null;

        // Validate established year
        if (data.established_year && (data.established_year < 1000 || data.established_year > new Date().getFullYear())) {
          throw new Error('Invalid established year');
        }
      }

      const university = await universityRepository.update(id, data, tenantId);
      return {
        success: true,
        data: university,
        message: 'University updated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteUniversity(id, tenantId) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid university ID');
      }

      // Check if university exists
      const university = await universityRepository.findById(id, tenantId);
      if (!university) {
        throw new Error('University not found');
      }

      // Check if university has students
      const hasStudents = await universityRepository.hasStudents(id, tenantId);
      if (hasStudents) {
        throw new Error('Cannot delete university with associated students');
      }

      await universityRepository.delete(id, tenantId);
      return {
        success: true,
        message: 'University deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getUniversitiesWithStats(tenantId, universityId = null) {
    try {
      const universities = await universityRepository.getWithStudentCount(tenantId, universityId);
      return {
        success: true,
        data: universities,
        count: universities.length
      };
    } catch (error) {
      throw new Error(`Failed to fetch universities with stats: ${error.message}`);
    }
  }

  async activateUniversity(id, tenantId) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid university ID');
      }

      const university = await universityRepository.updateStatus(id, 'active', tenantId);
      if (!university) {
        throw new Error('University not found');
      }

      return {
        success: true,
        data: university,
        message: 'University activated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async deactivateUniversity(id, tenantId) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid university ID');
      }

      const university = await universityRepository.updateStatus(id, 'inactive', tenantId);
      if (!university) {
        throw new Error('University not found');
      }

      return {
        success: true,
        data: university,
        message: 'University deactivated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async suspendUniversity(id, tenantId) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid university ID');
      }

      const university = await universityRepository.updateStatus(id, 'suspended', tenantId);
      if (!university) {
        throw new Error('University not found');
      }

      return {
        success: true,
        data: university,
        message: 'University suspended successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async createUniversityAdmin(universityData, adminData, tenantId) {
    try {
      // First create the university
      const universityResult = await this.createUniversity(universityData, tenantId);
      const university = universityResult.data;

      // Then create the university admin user
      const adminUserData = {
        email: adminData.email,
        password: adminData.password,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        role: 'university_admin',
        universityId: university.id,
        department: adminData.department || null,
        tenantId: tenantId
      };

      const adminResult = await authService.register(adminUserData);

      return {
        success: true,
        data: {
          university: university,
          admin: adminResult
        },
        message: 'University and admin created successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getUniversitiesByStatus(status, tenantId) {
    try {
      const universities = await universityRepository.findByStatus(status, tenantId);
      return {
        success: true,
        data: universities,
        count: universities.length
      };
    } catch (error) {
      throw new Error(`Failed to fetch universities by status: ${error.message}`);
    }
  }

  async getUniversityStats(tenantId) {
    try {
      const stats = await universityRepository.getUniversityStats(tenantId);
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      throw new Error(`Failed to fetch university stats: ${error.message}`);
    }
  }
}

module.exports = new UniversityService();