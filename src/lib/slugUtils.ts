export function generateSlug(title: string, id?: string): string {
    if (!title) return "event";
    
    // Remplacement basique des caractères accentués
    const from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
    const to   = "aaaaeeeeiiiioooouuuunc------";
    let str = title.toLowerCase().trim();
    for (let i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }
    
    let slug = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-'); // collapse dashes
        
    if (id) {
        slug += '-' + id.split('-')[0];
    } else {
        slug += '-' + Math.random().toString(36).substring(2, 7);
    }
    
    return slug || "event";
}
