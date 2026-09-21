import os

filepath = 'src/app/admin/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_delete = """    const deleteEvent = async (eventId: string) => {
        if (!confirm("Voulez-vous supprimer définitivement ce projet ?")) return;
        try {
            // Supprimer d'abord les tickets liés pour éviter les erreurs de clé étrangère
            const { error: ticketsError } = await supabase.from('tickets').delete().eq('event_id', eventId);
            if (ticketsError) {
                console.error("Erreur suppression tickets:", ticketsError);
                throw ticketsError;
            }

            // Ensuite, supprimer l'événement en demandant de retourner la ligne supprimée
            const { data, error } = await supabase.from('events').delete().eq('id', eventId).select();
            if (error) {
                console.error("Erreur suppression événement:", error);
                throw error;
            }

            // Si data est vide, cela signifie que la base de données a refusé la suppression (souvent à cause d'une politique de sécurité RLS)
            if (!data || data.length === 0) {
                throw new Error("La suppression a été bloquée par la base de données (Permissions insuffisantes ou événement introuvable).");
            }

            setRawEvents(rawEvents.filter(e => e.id !== eventId));
            if (selectedEvent?.id === eventId) setSelectedEvent(null);
            alert("Événement supprimé avec succès.");
        } catch (err: any) {
            console.error(err);
            alert("Erreur de suppression: " + (err.message || "Erreur inconnue"));
            // Forcer le rechargement pour restaurer l'état réel si la suppression a échoué
            fetchAdminData();
        }
    };"""

new_delete = """    const deleteEvent = async (eventId: string) => {
        if (!confirm("Voulez-vous supprimer définitivement ce projet ?")) return;
        try {
            const res = await fetch(`/api/admin/events/${eventId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            
            if (!res.ok || data.error) {
                throw new Error(data.error || "La suppression a échoué via l'API.");
            }

            setRawEvents(rawEvents.filter(e => e.id !== eventId));
            if (selectedEvent?.id === eventId) setSelectedEvent(null);
            alert("Événement supprimé avec succès.");
        } catch (err: any) {
            console.error(err);
            alert("Erreur de suppression: " + (err.message || "Erreur inconnue"));
            // Forcer le rechargement pour restaurer l'état réel si la suppression a échoué
            fetchAdminData();
        }
    };"""

content = content.replace(old_delete, new_delete)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated deleteEvent in admin page.tsx')
