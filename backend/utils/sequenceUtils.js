const pool = require("../config/database");
const { logger } = require("./logger");

/**
 * Check if a table is empty and reset its sequence if it is
 * @param {string} tableName - Name of the table to check
 * @param {string} sequenceName - Name of the sequence to reset (optional, will be auto-detected)
 * @returns {Promise<boolean>} - Returns true if sequence was reset, false otherwise
 */
const resetSequenceIfTableEmpty = async (tableName, sequenceName = null) => {
  try {
    // Check if table is empty
    const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const rowCount = parseInt(countResult.rows[0].count);
    
    if (rowCount === 0) {
      // Auto-detect sequence name if not provided
      if (!sequenceName) {
        sequenceName = `${tableName}_id_seq`;
      }
      
      // Check if sequence exists
      const sequenceCheck = await pool.query(
        `SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = $1`,
        [sequenceName]
      );
      
      if (sequenceCheck.rows.length > 0) {
        // Reset the sequence to start from 1
        await pool.query(`ALTER SEQUENCE public.${sequenceName} RESTART WITH 1`);
        
        logger.info(`Sequence reset: ${sequenceName} (table ${tableName} is empty)`);
        return true;
      } else {
        logger.warn(`Sequence not found: ${sequenceName}`);
      }
    }
    
    return false;
  } catch (error) {
    logger.error(`Error checking/resetting sequence for table ${tableName}:`, error);
    // Don't throw error to avoid breaking the main operation
    return false;
  }
};

/**
 * Reset all sequences for empty tables
 * @returns {Promise<Array>} - Returns array of reset sequence names
 */
const resetAllSequencesForEmptyTables = async () => {
  try {
    const resetSequences = [];
    
    // Define table-sequence mappings
    const tableSequenceMappings = [
      { table: 'users', sequence: 'users_id_seq' },
      { table: 'project_groups', sequence: 'project_groups_id_seq' },
      { table: 'projects', sequence: 'projects_id_seq' },
      { table: 'deployments', sequence: 'deployments_id_seq' },
      { table: 'maintenance_requests', sequence: 'maintenance_requests_id_seq' },
      { table: 'maintenance_status_history', sequence: 'maintenance_status_history_id_seq' },
      { table: 'maintenance_work_logs', sequence: 'maintenance_work_logs_id_seq' },
      { table: 'deployment_scripts', sequence: 'deployment_scripts_id_seq' }
    ];
    
    for (const mapping of tableSequenceMappings) {
      const wasReset = await resetSequenceIfTableEmpty(mapping.table, mapping.sequence);
      if (wasReset) {
        resetSequences.push(mapping.sequence);
      }
    }
    
    return resetSequences;
  } catch (error) {
    logger.error('Error resetting sequences for empty tables:', error);
    return [];
  }
};

/**
 * Get current sequence values for monitoring
 * @returns {Promise<Array>} - Returns array of sequence information
 */
const getSequenceStatus = async () => {
  try {
    const result = await pool.query(`
      SELECT 
        schemaname, 
        sequencename, 
        last_value,
        is_called
      FROM pg_sequences 
      WHERE schemaname = 'public' 
      ORDER BY sequencename
    `);
    
    return result.rows;
  } catch (error) {
    logger.error('Error getting sequence status:', error);
    return [];
  }
};

module.exports = {
  resetSequenceIfTableEmpty,
  resetAllSequencesForEmptyTables,
  getSequenceStatus
};