export interface RiskIndicator {
  id: string;
  name: string;
  description: string; // Plain-language explanation
  reason: string; // Why it may be risky
  recommendation: string; // Recommended safe next step
}

export interface ScamCheckResult {
  indicators: RiskIndicator[];
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface ScamRule {
  id: string;
  name: string;
  description: string;
  reason: string;
  recommendation: string;
  pattern: RegExp;
  severity: 'Low' | 'Medium' | 'High';
}

const rules: ScamRule[] = [
  {
    id: 'URGENCY',
    name: 'Urgent Demand',
    description: 'The message demands immediate action or threatens consequences.',
    reason: 'Scammers often create a false sense of urgency to make you panic and act without thinking.',
    recommendation: 'Do not panic. Take your time to verify the claim through official channels (e.g., call your bank directly using the number on the back of your card).',
    pattern: /(immediate(?:ly)?|urgent|suspend|block|action required|within \d+ hours|account will be closed)/i,
    severity: 'Medium'
  },
  {
    id: 'OTP_REQUEST',
    name: 'Request for Sensitive Information',
    description: 'The message asks for an OTP, PIN, password, or CVV.',
    reason: 'Legitimate organizations, including banks and support staff, will NEVER ask for your OTP, PIN, or password.',
    recommendation: 'Do not share your OTP, PIN, or password with anyone under any circumstances. Report the message.',
    pattern: /(otp|pin|password|cvv|one time password|secret code)/i,
    severity: 'High'
  },
  {
    id: 'SUSPICIOUS_LINK',
    name: 'Suspicious Link',
    description: 'The message contains a link to a website, often disguised as a legitimate service.',
    reason: 'Links in unsolicited messages often lead to phishing sites designed to steal your credentials or install malware.',
    recommendation: 'Do not click the link. If you need to log in to a service, open a new browser window and type the official website address yourself.',
    pattern: /(http|https|bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|cli\.gs|ig\.me)/i,
    severity: 'Medium'
  },
  {
    id: 'UNEXPECTED_MONEY',
    name: 'Unexpected Money or Prize',
    description: 'The message claims you have won a prize, lottery, or received an unexpected payment.',
    reason: 'This is a common tactic to lure victims into paying an "advance fee" or providing bank details to claim money that does not exist.',
    recommendation: 'If it sounds too good to be true, it probably is. Ignore the message and do not pay any fees to claim a prize.',
    pattern: /(won a prize|lottery|lucky draw|cash prize|unexpected payment|claim your money|transfer received)/i,
    severity: 'High'
  },
  {
    id: 'SUSPICIOUS_PAYMENT_INSTRUCTION',
    name: 'Suspicious Payment Instruction',
    description: 'The message asks you to make a payment to a personal account, via crypto, or gift cards.',
    reason: 'Scammers prefer untraceable or hard-to-reverse payment methods.',
    recommendation: 'Never send money to an unknown party, especially using unusual methods like gift cards or cryptocurrency.',
    pattern: /(gift card|bitcoin|crypto|wire transfer|western union|pay to this account)/i,
    severity: 'High'
  }
];

export function analyzeMessage(message: string): ScamCheckResult {
  const indicators: RiskIndicator[] = [];
  let highestSeverity: 'Low' | 'Medium' | 'High' = 'Low';

  if (!message || message.trim() === '') {
    return { indicators, riskLevel: 'Low' };
  }

  for (const rule of rules) {
    if (rule.pattern.test(message)) {
      indicators.push({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        reason: rule.reason,
        recommendation: rule.recommendation
      });
      
      if (rule.severity === 'High') {
        highestSeverity = 'High';
      } else if (rule.severity === 'Medium' && highestSeverity !== 'High') {
        highestSeverity = 'Medium';
      }
    }
  }

  return {
    indicators,
    riskLevel: highestSeverity
  };
}
