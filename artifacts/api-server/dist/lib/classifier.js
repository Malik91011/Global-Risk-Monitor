const categoryKeywords = {
    Security: ["terrorist", "terrorism", "bomb", "explosion", "attack", "military", "armed", "gunfire", "shooting", "war", "conflict", "insurgent", "militant", "kidnap", "hostage", "assassination", "coup", "airstrike", "missile", "drone strike"],
    Crime: ["murder", "killed", "robbery", "theft", "fraud", "corruption", "arrest", "drug", "trafficking", "gang", "cartel", "heist", "burglary", "assault", "homicide", "kidnapping", "extortion", "bribe"],
    PublicSafety: ["accident", "crash", "collision", "fire", "blaze", "explosion", "road", "traffic", "emergency", "rescue", "disaster", "flood", "earthquake", "tsunami", "storm", "hurricane", "cyclone", "tornado", "evacuation"],
    Health: ["outbreak", "disease", "virus", "epidemic", "pandemic", "health", "hospital", "medical", "infection", "vaccination", "quarantine", "illness", "deaths", "cholera", "malaria", "dengue", "ebola", "mpox", "monkeypox"],
    Hazards: ["chemical", "toxic", "pollution", "spill", "leak", "nuclear", "radiation", "environmental", "wildfire", "landslide", "drought", "contamination", "hazardous", "industrial accident"],
    Cyber: ["cyber", "hack", "breach", "ransomware", "malware", "phishing", "data breach", "ddos", "cybercrime", "digital attack", "network", "online fraud", "identity theft"],
    CivilPolitical: ["protest", "demonstration", "riot", "strike", "election", "political", "government", "opposition", "coup", "unrest", "civil", "human rights", "detention", "martial law", "curfew", "blockade"],
    Other: [],
};
const criticalKeywords = ["mass casualty", "multiple fatalities", "dozens killed", "hundreds killed", "terrorist attack", "major explosion", "chemical weapon", "nuclear", "catastrophic", "state of emergency"];
const highKeywords = ["killed", "dead", "fatalities", "bomb", "shooting", "armed attack", "serious", "major incident", "widespread", "multiple casualties"];
const ongoingKeywords = ["ongoing", "continues", "still active", "unresolved", "developing", "escalating", "breaking", "live updates"];
const moderateKeywords = ["injured", "wounded", "disruption", "suspended", "closed", "warning", "alert", "threat", "potential"];
export function classifyCategory(title, content) {
    const text = `${title} ${content}`.toLowerCase();
    let bestCategory = "Other";
    let bestScore = 0;
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (category === "Other")
            continue;
        const score = keywords.filter(kw => text.includes(kw)).length;
        if (score > bestScore) {
            bestScore = score;
            bestCategory = category;
        }
    }
    return bestCategory;
}
export function classifyRiskLevel(title, content, category) {
    const text = `${title} ${content}`.toLowerCase();
    if (criticalKeywords.some(kw => text.includes(kw)))
        return "Critical";
    if (category === "Security" && highKeywords.some(kw => text.includes(kw)))
        return "High";
    if (highKeywords.some(kw => text.includes(kw)))
        return "High";
    if (ongoingKeywords.some(kw => text.includes(kw)))
        return "Ongoing";
    if (category === "Security" || category === "Crime")
        return "HighImpact";
    if (moderateKeywords.some(kw => text.includes(kw)))
        return "Moderate";
    return "Low";
}
export function extractTags(title, content, country) {
    const tags = [country];
    const text = `${title} ${content}`.toLowerCase();
    const tagKeywords = [
        "terrorism", "protest", "flood", "earthquake", "outbreak", "election",
        "military", "police", "cyber", "corruption", "road accident", "fire",
        "explosion", "kidnapping", "drug trafficking", "gang violence",
    ];
    for (const kw of tagKeywords) {
        if (text.includes(kw))
            tags.push(kw);
    }
    return [...new Set(tags)].slice(0, 10);
}
export function generateAiSummary(title, content, category, riskLevel, country) {
    const risk = riskLevel === "Critical" ? "critically dangerous" :
        riskLevel === "High" ? "high risk" :
            riskLevel === "HighImpact" ? "high impact" :
                riskLevel === "Ongoing" ? "an evolving" :
                    riskLevel === "Moderate" ? "moderate concern" : "low-level";
    const catDesc = category === "Security" ? "security incident" :
        category === "Crime" ? "criminal incident" :
            category === "PublicSafety" ? "public safety event" :
                category === "Health" ? "health-related event" :
                    category === "Hazards" ? "environmental hazard" :
                        category === "Cyber" ? "cyber incident" :
                            category === "CivilPolitical" ? "civil/political event" : "incident";
    const snippet = content ? content.slice(0, 200).trim() : title;
    return `[AI Assessment] A ${risk} ${catDesc} reported in ${country}. ${snippet}${content && content.length > 200 ? "..." : ""} Authorities and stakeholders are advised to monitor the situation closely.`;
}
