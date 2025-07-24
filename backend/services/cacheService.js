const { redisClient } = require('../database/redis');
const { generateEmbedding } = require('./embedding');

// Maximum number of cached queries per chatbot
const MAX_CACHED_QUERIES = 5;

function normalizeQuery(query) {
  return query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

async function computeCosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

async function similarity(cachedQuery, newQuery) {
    const cachedEmbedding = await generateEmbedding(cachedQuery);
    const newEmbedding = await generateEmbedding(newQuery);
    return computeCosineSimilarity(cachedEmbedding, newEmbedding);
}

async function cacheReply(query, response, chatbotId) {
    try {
        const normalizedQuery = normalizeQuery(query);
        const cacheKey = `chatbot:${chatbotId}:queries`;
        const queryKey = `chatbot:${chatbotId}:${normalizedQuery}`;
        
        // Store the individual query response
        await redisClient.hSet(queryKey, {
            query: query,
            response: JSON.stringify(response.reply || response.answer),
            related_questions: JSON.stringify(response.related_questions || []),
            timestamp: Date.now()
        });
        await redisClient.expire(queryKey, 3600);
        
        // Add to the chatbot's query list
        await redisClient.lPush(cacheKey, queryKey);
        
        // Trim the list to maintain only 5 most recent queries
        await redisClient.lTrim(cacheKey, 0, MAX_CACHED_QUERIES - 1);
        await redisClient.expire(cacheKey, 3600);
        
        // console.log(`✅ Cached reply for query: ${query}`);
    } catch (error) {
        console.error('❌ Error caching reply:', error);
    }
}

async function getCachedReplies(chatbotId) {
    try {
        const cacheKey = `chatbot:${chatbotId}:queries`;
        const queryKeys = await redisClient.lRange(cacheKey, 0, -1);
        
        if (!queryKeys || queryKeys.length === 0) return null;
        
        // Get all cached queries
        const cachedQueries = [];
        for (const queryKey of queryKeys) {
            const cachedData = await redisClient.hGetAll(queryKey);
            if (cachedData && cachedData.response) {
                cachedQueries.push({
                    query: cachedData.query,
                    response: JSON.parse(cachedData.response),
                    related_questions: JSON.parse(cachedData.related_questions || '[]'),
                    timestamp: parseInt(cachedData.timestamp || '0')
                });
            }
        }
        
        // Sort by timestamp (newest first)
        cachedQueries.sort((a, b) => b.timestamp - a.timestamp);
        
        return cachedQueries.length > 0 ? cachedQueries : null;
    } catch (error) {
        console.error('❌ Error retrieving cached replies:', error);
        return null;
    }
}

async function getMostSimilarCachedReply(chatbotId, currentQuery) {
    try {
        const normalizedQuery = normalizeQuery(currentQuery);
        const cachedQueries = await getCachedReplies(chatbotId);
        if (!cachedQueries) return null;

        // Check for exact match first
        const exactMatch = cachedQueries.find(cached => 
            normalizeQuery(cached.query) === normalizedQuery
        );
        if (exactMatch) return exactMatch;

        // Fall back to semantic similarity
        let mostSimilar = null;
        let highestSimilarity = 0;

        for (const cached of cachedQueries) {
            const simScore = await similarity(cached.query, currentQuery);
            // console.log(`Similarity between "${cached.query}" and "${currentQuery}": ${simScore}`);
            if (simScore > highestSimilarity) {
                highestSimilarity = simScore;
                mostSimilar = cached;
            }
        }

        return highestSimilarity > 0.8 ? mostSimilar : null;
    } catch (error) {
        console.error('❌ Error finding similar cached reply:', error);
        return null;
    }
}

module.exports = {
    cacheReply,
    getCachedReplies,
    getMostSimilarCachedReply,
    similarity
};