use crate::preferences::PreferenceGraph;

// WHY: Appends customized formatting and constraint rules to prompts based on learned preference graph weights
pub fn apply_style(prompt_template: &str, prefs: &PreferenceGraph) -> String {
    let mut instructions = Vec::new();
    
    // 1. Tone styling
    let tone_casual = prefs.get_preference("tone_casual");
    if tone_casual > 0.7 {
        instructions.push("Tone constraint: Use a casual, friendly, and informal tone with contractions.");
    } else if tone_casual < 0.3 {
        instructions.push("Tone constraint: Use a formal, professional, and structured tone.");
    }

    // 2. Risk preference styling
    let risk_averse = prefs.get_preference("risk_averse");
    if risk_averse > 0.7 {
        instructions.push("Safety constraint: Highlight risks and prioritize security, safety, and cautious action.");
    } else if risk_averse < 0.3 {
        instructions.push("Speed constraint: Focus on optimization, speed, and aggressive task completion.");
    }

    // 3. Diet constraints (for travel/dinners)
    let diet_vegan = prefs.get_preference("diet_vegan");
    if diet_vegan > 0.8 {
        instructions.push("Diet constraint: Filter all recipes and bookings to strictly vegan options.");
    }

    if instructions.is_empty() {
        prompt_template.to_string()
    } else {
        format!("{}\n\n[System Instructions]\n{}", prompt_template, instructions.join("\n"))
    }
}
