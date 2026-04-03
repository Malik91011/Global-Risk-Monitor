export const THREAT_TEMPLATES = {
    Security: [
        "Armed groups operating in the region",
        "Risk of targeted attacks on foreign nationals",
        "Potential for improvised explosive devices (IEDs)",
        "Kidnapping for ransom threats",
        "Armed checkpoints and roadblocks",
    ],
    Crime: [
        "High rates of violent crime in urban areas",
        "Organized criminal networks operating in the area",
        "Risk of theft and robbery targeting foreigners",
        "Drug-related violence in affected zones",
        "Opportunistic crime during civil unrest",
    ],
    PublicSafety: [
        "Infrastructure damage affecting emergency response",
        "Road closures and traffic disruptions",
        "Risk of secondary incidents (aftershocks, flash flooding)",
        "Overwhelmed medical facilities",
        "Power outages affecting communications",
    ],
    Health: [
        "Disease transmission risk in affected areas",
        "Limited medical infrastructure and supplies",
        "Risk of contaminated water and food supplies",
        "Healthcare facility overcapacity",
        "Potential for rapid regional spread",
    ],
    Hazards: [
        "Environmental contamination affecting populated areas",
        "Toxic exposure risks for residents",
        "Long-term health impacts from hazardous materials",
        "Agricultural disruption from contamination",
        "Air quality deterioration",
    ],
    Cyber: [
        "Critical infrastructure systems at risk",
        "Financial and banking system vulnerabilities",
        "Government communication systems compromised",
        "Personal data of citizens potentially exposed",
        "Supply chain disruptions from system outages",
    ],
    CivilPolitical: [
        "Risk of violence at protest locations",
        "Increased security force presence and checkpoints",
        "Potential for rapid escalation of civil unrest",
        "Disruption to public services and transport",
        "Risk of curfew implementation",
    ],
    Other: [
        "Situational awareness required",
        "Monitor local authorities for updates",
        "Potential for escalation",
    ],
};
export const SAFETY_RECOMMENDATIONS = {
    Security: [
        "Avoid areas of known militant activity",
        "Travel in secure convoys with local knowledge",
        "Maintain low profile and avoid displaying wealth",
        "Register with your embassy and keep contact details current",
        "Have pre-arranged evacuation plans and emergency contacts",
        "Avoid travel at night in high-risk areas",
    ],
    Crime: [
        "Use reputable transportation services only",
        "Avoid displaying valuables in public",
        "Travel in groups where possible",
        "Be aware of your surroundings at all times",
        "Keep emergency numbers readily accessible",
        "Secure accommodations in well-monitored areas",
    ],
    PublicSafety: [
        "Follow instructions from local authorities and emergency services",
        "Stock emergency supplies including water, food, and medication",
        "Identify and know routes to emergency shelters",
        "Keep communication devices charged and have backup plans",
        "Monitor official emergency broadcasts",
    ],
    Health: [
        "Follow WHO and local health authority guidelines",
        "Ensure vaccinations are up to date",
        "Use filtered or bottled water only",
        "Practice strict hygiene and sanitation protocols",
        "Wear appropriate PPE if entering affected areas",
        "Seek medical attention immediately if symptoms appear",
    ],
    Hazards: [
        "Evacuate affected areas as directed by authorities",
        "Avoid contact with contaminated materials",
        "Use N95 masks in areas with poor air quality",
        "Do not consume locally produced food or water until cleared",
        "Follow decontamination procedures after exposure",
    ],
    Cyber: [
        "Change critical passwords and enable multi-factor authentication",
        "Avoid using public Wi-Fi for sensitive transactions",
        "Monitor financial accounts for unauthorized activity",
        "Back up important data to offline storage",
        "Report suspicious cyber activity to authorities",
    ],
    CivilPolitical: [
        "Avoid protest locations and areas of civil unrest",
        "Monitor local news and government announcements",
        "Carry identification documents at all times",
        "Know the location of your nearest embassy or consulate",
        "Have a communication plan with family and colleagues",
    ],
    Other: [
        "Exercise heightened caution",
        "Stay informed through official channels",
        "Defer non-essential travel to the area",
    ],
};
const OPERATIONAL_GUIDANCE = {
    Security: [
        "Conduct thorough security assessments before any field operations",
        "Implement a buddy system for all movements outside secure compounds",
        "Establish and test communication check-in procedures",
        "Coordinate with local security forces and NGO networks",
        "Review and update emergency action plans",
        "Consider postponing non-essential operations until situation stabilizes",
    ],
    Crime: [
        "Restrict cash holdings and use electronic payments where possible",
        "Vary routines and routes to reduce predictability",
        "Implement visitor management protocols at facilities",
        "Brief all staff on crime prevention measures",
        "Establish clear protocols for robbery and theft incidents",
    ],
    PublicSafety: [
        "Activate business continuity plans as appropriate",
        "Assess structural integrity of facilities in affected areas",
        "Coordinate with local authorities on access and restrictions",
        "Deploy emergency response teams to support operations",
        "Document damages and report to relevant authorities",
    ],
    Health: [
        "Activate health emergency protocols for field staff",
        "Ensure medical evacuation plans are in place",
        "Brief all staff on disease prevention measures",
        "Coordinate with health authorities and WHO representatives",
        "Suspend non-essential operations in highest-risk zones",
    ],
    Hazards: [
        "Conduct environmental impact assessment of operations",
        "Ensure PPE is available and staff are trained in use",
        "Coordinate with environmental agencies for monitoring",
        "Review and update emergency response procedures",
        "Consider temporary suspension of operations in contaminated areas",
    ],
    Cyber: [
        "Activate incident response procedures immediately",
        "Isolate affected systems from network",
        "Engage cybersecurity incident response team",
        "Report incidents to relevant authorities and stakeholders",
        "Review and strengthen access controls and monitoring",
    ],
    CivilPolitical: [
        "Maintain strict political neutrality in all communications",
        "Brief staff on appropriate behavior during civil unrest",
        "Ensure safe rooms and lockdown procedures are established",
        "Maintain open communication channels with security networks",
        "Monitor situation continuously for escalation indicators",
    ],
    Other: [
        "Maintain heightened operational awareness",
        "Review contingency plans and ensure staff readiness",
        "Consult with local partners and authorities",
    ],
};
export function generateIncidentBullets(category, riskLevel) {
    const cat = category || "Other";
    const threats = THREAT_TEMPLATES[cat] || THREAT_TEMPLATES.Other;
    const recs = SAFETY_RECOMMENDATIONS[cat] || SAFETY_RECOMMENDATIONS.Other;
    const riskPrefix = riskLevel === "Critical" ? "Immediate threat to life and assets." :
        riskLevel === "High" || riskLevel === "HighImpact" ? "Significant security concern requiring elevated precautions." :
            riskLevel === "Ongoing" ? "Evolving situation — continued monitoring required." :
                riskLevel === "Moderate" ? "Elevated risk — standard protocols should be enhanced." :
                    "Low-level risk — standard precautions apply.";
    const assessment = [riskPrefix, ...threats.slice(0, 3)].slice(0, 4);
    const advisory = recs.slice(0, 4);
    return { assessment, advisory };
}
export function generateThreatAssessment(country, region, incidents) {
    const riskCounts = {
        Critical: 0, High: 0, HighImpact: 0, Ongoing: 0, Moderate: 0, Low: 0,
    };
    const categoryCounts = {};
    for (const incident of incidents) {
        riskCounts[incident.riskLevel]++;
        categoryCounts[incident.category] = (categoryCounts[incident.category] || 0) + 1;
    }
    let overallRisk = "Low";
    if (riskCounts.Critical > 0)
        overallRisk = "Critical";
    else if (riskCounts.High > 2)
        overallRisk = "High";
    else if (riskCounts.High > 0 || riskCounts.HighImpact > 2)
        overallRisk = "High";
    else if (riskCounts.HighImpact > 0 || riskCounts.Ongoing > 1)
        overallRisk = "HighImpact";
    else if (riskCounts.Ongoing > 0 || riskCounts.Moderate > 2)
        overallRisk = "Ongoing";
    else if (riskCounts.Moderate > 0)
        overallRisk = "Moderate";
    const topCategory = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || "Other";
    const keyThreats = [
        ...(THREAT_TEMPLATES[topCategory] || THREAT_TEMPLATES.Other).slice(0, 3),
        ...incidents.slice(0, 2).map(i => `${i.title.slice(0, 100)} (${i.riskLevel})`),
    ];
    const safetyRecs = (SAFETY_RECOMMENDATIONS[topCategory] || SAFETY_RECOMMENDATIONS.Other).slice(0, 5);
    const opGuidance = (OPERATIONAL_GUIDANCE[topCategory] || OPERATIONAL_GUIDANCE.Other).slice(0, 5);
    const totalIncidents = incidents.length;
    const criticalCount = riskCounts.Critical;
    const ongoingCount = riskCounts.Ongoing;
    const location = region ? `${region}, ${country}` : country;
    const summary = `GlobeWatch360 Threat Assessment for ${location}: ${totalIncidents} incident(s) recorded in the monitoring period. ` +
        `Risk level assessed as ${overallRisk.toUpperCase()}. ` +
        (criticalCount > 0 ? `${criticalCount} critical incident(s) require immediate attention. ` : "") +
        (ongoingCount > 0 ? `${ongoingCount} situation(s) are actively developing. ` : "") +
        `Primary threat category: ${topCategory}. ` +
        `Personnel and assets in this area should exercise ` +
        (overallRisk === "Critical" ? "maximum vigilance and consider evacuation." :
            overallRisk === "High" ? "extreme caution and review emergency protocols." :
                overallRisk === "HighImpact" ? "heightened caution and remain prepared for rapid changes." :
                    overallRisk === "Ongoing" ? "sustained awareness as situations are evolving." :
                        overallRisk === "Moderate" ? "appropriate precautions and monitor developments." :
                            "standard precautions while remaining informed.");
    const affectedAreas = [country];
    if (region)
        affectedAreas.push(region);
    const cities = [...new Set(incidents.map(i => i.city).filter(Boolean))];
    affectedAreas.push(...cities.slice(0, 3));
    return {
        incidentId: null,
        country,
        region: region || null,
        overallRisk,
        summary,
        keyThreats,
        safetyRecommendations: safetyRecs,
        operationalGuidance: opGuidance,
        affectedAreas,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
}
export function generateReportContent(title, country, region, incidents, includeAssessment, includeAdvisory) {
    const criticalCount = incidents.filter(i => i.riskLevel === "Critical").length;
    const highCount = incidents.filter(i => i.riskLevel === "High" || i.riskLevel === "HighImpact").length;
    const moderateCount = incidents.filter(i => i.riskLevel === "Moderate" || i.riskLevel === "Ongoing").length;
    const lowCount = incidents.filter(i => i.riskLevel === "Low").length;
    const location = region ? `${region}, ${country}` : country || "Global";
    const now = new Date().toISOString().split("T")[0];
    const executiveSummary = `GLOBEWATCH360 INTELLIGENCE REPORT: ${title.toUpperCase()}\n` +
        `Generated: ${now}\n` +
        `Coverage Area: ${location}\n` +
        `Total Incidents Analyzed: ${incidents.length}\n` +
        `Critical: ${criticalCount} | High: ${highCount} | Moderate: ${moderateCount} | Low: ${lowCount}\n\n` +
        `Overall Risk Assessment: ${criticalCount > 0 ? "CRITICAL" : highCount > 0 ? "HIGH" : moderateCount > 0 ? "MODERATE" : "LOW"}\n\n` +
        `This report presents an intelligence assessment of ${incidents.length} incident(s) recorded for ${location}. ` +
        `The security environment requires ${criticalCount > 0 ? "immediate attention and emergency protocols" : highCount > 0 ? "heightened vigilance and precautionary measures" : "standard monitoring procedures"}.`;
    let content = `${executiveSummary}\n\n${"=".repeat(60)}\n\nINCIDENT BREAKDOWN\n${"=".repeat(60)}\n\n`;
    for (const incident of incidents.slice(0, 50)) {
        content += `[${incident.riskLevel.toUpperCase()}] ${incident.title}\n`;
        content += `Location: ${[incident.city, incident.region, incident.country].filter(Boolean).join(", ")}\n`;
        content += `Category: ${incident.category} | Date: ${new Date(incident.publishedAt).toISOString().split("T")[0]}\n`;
        content += `Source: ${incident.sourceName}\n`;
        content += `Summary: ${incident.summary}\n`;
        if (incident.aiSummary)
            content += `AI Analysis: ${incident.aiSummary}\n`;
        content += "\n";
    }
    if (includeAssessment && incidents.length > 0) {
        const assessment = generateThreatAssessment(country || "Global", region || null, incidents);
        content += `\n${"=".repeat(60)}\nTHREAT ASSESSMENT\n${"=".repeat(60)}\n\n`;
        content += `Overall Risk: ${assessment.overallRisk.toUpperCase()}\n\n`;
        content += `${assessment.summary}\n\n`;
        content += `KEY THREATS:\n${assessment.keyThreats.map(t => `• ${t}`).join("\n")}\n\n`;
        content += `SAFETY RECOMMENDATIONS:\n${assessment.safetyRecommendations.map(r => `• ${r}`).join("\n")}\n\n`;
        content += `OPERATIONAL GUIDANCE:\n${assessment.operationalGuidance.map(g => `• ${g}`).join("\n")}\n\n`;
    }
    let advisory = null;
    if (includeAdvisory) {
        advisory = `TRAVEL & OPERATIONAL ADVISORY\n${"=".repeat(40)}\n\n`;
        advisory += `Issued by: GlobeWatch360 Intelligence\n`;
        advisory += `Date: ${now}\n`;
        advisory += `Area: ${location}\n\n`;
        if (criticalCount > 0) {
            advisory += `⚠️ CRITICAL ADVISORY: DO NOT TRAVEL\n`;
            advisory += `The current security situation in ${location} presents extreme risk. Non-essential travel should be avoided. Personnel currently in the area should prepare for immediate evacuation if directed by authorities.\n\n`;
        }
        else if (highCount > 0) {
            advisory += `🔴 HIGH RISK ADVISORY: EXERCISE EXTREME CAUTION\n`;
            advisory += `Security conditions in ${location} are severely impacted. Only essential travel should be undertaken with comprehensive security protocols in place.\n\n`;
        }
        else if (moderateCount > 0) {
            advisory += `🟡 MODERATE RISK ADVISORY: EXERCISE CAUTION\n`;
            advisory += `Monitor the situation in ${location} closely. Standard security protocols apply with enhanced awareness of developing situations.\n\n`;
        }
        else {
            advisory += `🟢 LOW RISK: NORMAL PRECAUTIONS APPLY\n`;
            advisory += `Current conditions in ${location} present standard risk levels. Maintain normal operational protocols and stay informed of any changes.\n\n`;
        }
        advisory += `For updates, consult GlobeWatch360 at regular intervals.`;
        content += `\n${"=".repeat(60)}\n${advisory}\n`;
    }
    return { content, executiveSummary, advisory, criticalCount, highCount, moderateCount, lowCount };
}
