// utils/aiAssistant.js - FIXED VERSION
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Use a working model - check https://console.groq.com/docs/models for available models
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

// utils/aiAssistant.js - FIXED VERSION
// utils/aiAssistant.js - IMPROVED VERSION with mixed query handling
const classifyIssueType = async (title, description) => {
  try {
    console.log(`\n=== CLASSIFYING: "${title}" ===`);
    
    const descriptionLower = description.toLowerCase().trim();
    const titleLower = title.toLowerCase().trim();
    const fullText = titleLower + ' ' + descriptionLower;
    
    // 1. Identify CLEARLY non-technical queries
    const nonTechnicalPhrases = [
      'vacation policy', 'leave policy', 'hr policy', 'company policy',
      'salary slip', 'pay slip', 'holiday schedule', 'office timing',
      'attendance policy', 'work from home policy', 'dress code',
      'complaint about', 'personal issue', 'behavior issue'
    ];
    
    // 2. Identify CLEARLY technical queries
    const technicalPhrases = [
      'outlook crash', 'email not working', 'cannot send email', 'email error',
      'wifi not working', 'cannot connect', 'network issue', 'internet problem',
      'password reset', 'login failed', 'access denied', 'permission denied',
      'printer not working', 'scanner issue', 'hardware problem',
      'software install', 'update failed', 'system error', 'blue screen',
      'vpn connection', 'remote access', 'server down', 'database error',
      'application crash', 'program not responding', 'slow performance'
    ];
    
    // Check for non-technical content
    const hasNonTechnical = nonTechnicalPhrases.some(phrase => 
      fullText.includes(phrase)
    );
    
    // Check for technical content
    const hasTechnical = technicalPhrases.some(phrase => 
      fullText.includes(phrase)
    );
    
    // 3. Handle greetings/very short
    const isTooShort = description.length < 15;
    const isJustGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(descriptionLower);
    
    console.log(`Analysis: 
      Non-Technical: ${hasNonTechnical} (phrases: ${nonTechnicalPhrases.filter(p => fullText.includes(p))})
      Technical: ${hasTechnical} (phrases: ${technicalPhrases.filter(p => fullText.includes(p))})
      Short: ${isTooShort}
      Greeting: ${isJustGreeting}
    `);
    
    // DECISION LOGIC
    
    // 1. Handle pure greetings/short
    if (isJustGreeting || (isTooShort && !hasTechnical && !hasNonTechnical)) {
      return {
        category: "General",
        isTechnical: false,
        shouldHandleByAI: true,
        confidence: 0.9,
        priority: "low",
        aiResponse: "Hello! I'm here to help with technical support. Please describe your technical issue.",
        reason: "Greeting or very short query",
        useMainModel: false
      };
    }
    
    // 2. Handle MIXED queries (both technical and non-technical)
    if (hasTechnical && hasNonTechnical) {
      console.log("Mixed query detected - splitting response");
      
      // Extract technical parts for ticket
      const technicalParts = technicalPhrases.filter(p => fullText.includes(p));
      
      // Extract non-technical parts for AI response
      const nonTechnicalParts = nonTechnicalPhrases.filter(p => fullText.includes(p));
      
      const aiResponse = `I see you have multiple requests:
      
1. **Technical Issue (Creating Ticket):** ${technicalParts.join(', ')}
   - Please provide more details about the technical issue in the ticket.

2. **Non-Technical Query:** ${nonTechnicalParts.join(', ')}
   - For HR/policy questions, please contact HR at hr@company.com
   - For vacation policies, visit the HR portal or contact your manager`;

      return {
        category: "Mixed Query",
        isTechnical: true, // Default to technical to create ticket
        shouldHandleByAI: true,
        confidence: 0.6,
        priority: "medium",
        aiResponse: aiResponse,
        reason: "Mixed technical and non-technical query",
        useMainModel: false,
        mixedQuery: true,
        technicalParts: technicalParts,
        nonTechnicalParts: nonTechnicalParts
      };
    }
    
    // 3. Handle pure non-technical
    if (hasNonTechnical && !hasTechnical) {
      let aiResponse = "";
      
      if (fullText.includes('vacation') || fullText.includes('leave')) {
        aiResponse = "For vacation and leave policies, please contact HR department at hr@company.com or visit the HR portal.";
      } else if (fullText.includes('salary') || fullText.includes('pay')) {
        aiResponse = "Salary-related queries should be directed to the payroll department at payroll@company.com.";
      } else if (fullText.includes('policy')) {
        aiResponse = "Company policies are available on the intranet. For specific policy questions, please contact your manager or HR.";
      } else if (fullText.includes('complaint') || fullText.includes('behavior')) {
        aiResponse = "For complaints or personal issues, please contact HR directly or speak with your manager.";
      } else {
        aiResponse = "This appears to be a non-technical query. Please contact the relevant department for assistance.";
      }
      
      aiResponse += "\n\nIf you have a technical issue, please create a separate ticket with details.";
      
      return {
        category: "Non-Technical",
        isTechnical: false,
        shouldHandleByAI: true,
        confidence: 0.8,
        priority: "low",
        aiResponse: aiResponse,
        reason: "Non-technical query",
        useMainModel: false
      };
    }
    
    // 4. Handle pure technical
    if (hasTechnical && !hasNonTechnical) {
      return {
        category: "Technical Support",
        isTechnical: true,
        shouldHandleByAI: false,
        confidence: 0.9,
        priority: "medium",
        reason: "Technical query - creating ticket",
        useMainModel: true
      };
    }
    
    // 5. Default for ambiguous
    console.log("Ambiguous query - defaulting to ticket creation");
    return {
      category: "General IT",
      isTechnical: true,
      shouldHandleByAI: false,
      confidence: 0.5,
      priority: "medium",
      reason: "Ambiguous query - creating ticket for review",
      useMainModel: true
    };
    
  } catch (error) {
    console.error("Error in classifyIssueType:", error);
    return {
      category: "General IT Support",
      isTechnical: true,
      shouldHandleByAI: false,
      confidence: 0.5,
      priority: "medium",
      reason: "Error - defaulting to ticket creation",
      useMainModel: true
    };
  }
};

const generateAIResponse = async (issue, isNonTechnical = false) => {
  // Simple responses without Groq API calls
  if (isNonTechnical) {
    return "Thank you for your query. This appears to be a non-technical matter. Please contact the relevant department for assistance with HR, administrative, or policy-related questions.";
  } else {
    return "Could you please provide more details about the technical issue? For example: specific error messages, what you were trying to do, when it started, and any troubleshooting steps you've already tried.";
  }
};

module.exports = {
  classifyIssueType,
  generateAIResponse
};