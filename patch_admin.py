import os

filepath = 'src/app/admin/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update fetch query
old_fetch = "const { data: votesData } = await supabase.from('votes_campaigns').select('*').order('created_at', { ascending: false });"
new_fetch = "const { data: votesData } = await supabase.from('votes_campaigns').select('*, votes_cast(status, vote_count, amount_paid)').order('created_at', { ascending: false });"
content = content.replace(old_fetch, new_fetch)

# 2. Update useMemo
old_memo = """        const totalRev = tickets.reduce((acc, t) => acc + Number(t.amount), 0);
        const evtsOnly = events.filter(i => i.type === 'event' || !i.type);"""

new_memo = """        const totalRevTickets = tickets.reduce((acc, t) => acc + Number(t.amount), 0);
        const validVotesGlobal = rawVotes.flatMap(v => (v.votes_cast || []).filter((vc: any) => vc.status === 'valid'));
        const totalRevVotes = validVotesGlobal.reduce((acc, vc) => acc + (vc.amount_paid || 0), 0);
        const totalRev = totalRevTickets + totalRevVotes;
        
        const evtsOnly = events.filter(i => i.type === 'event' || !i.type);"""
content = content.replace(old_memo, new_memo)

# 3. Add votes filtering in useMemo
old_return = """        const allDates = [...rawEvents.map(e => e.created_at), ...rawCampaigns.map(c => c.created_at)];"""
new_return = """        let votes = rawVotes;
        if (filters.search) {
            const s = filters.search.toLowerCase();
            votes = votes.filter(v => v.title.toLowerCase().includes(s));
        }
        if (filters.organizerId !== 'all') {
            votes = votes.filter(v => v.organizer_id === filters.organizerId);
        }
        if (filters.year !== 'all') {
            votes = votes.filter(v => new Date(v.created_at).getFullYear().toString() === filters.year);
        }
        if (filters.month !== 'all') {
            votes = votes.filter(v => (new Date(v.created_at).getMonth() + 1).toString() === filters.month);
        }
        votes = votes.map(v => {
            const valid = (v.votes_cast || []).filter((vc: any) => vc.status === 'valid');
            return {
                ...v,
                computedTotalVotes: valid.reduce((acc: any, vc: any) => acc + (vc.vote_count || 1), 0),
                computedTotalRevenue: valid.reduce((acc: any, vc: any) => acc + (vc.amount_paid || 0), 0)
            };
        });

        const allDates = [...rawEvents.map(e => e.created_at), ...rawCampaigns.map(c => c.created_at)];"""
content = content.replace(old_return, new_return)

# 4. Add filteredVotes to useMemo output
old_filtered = """            filteredTickets: tickets,
            filteredForms: forms,
            stats: {"""
new_filtered = """            filteredTickets: tickets,
            filteredForms: forms,
            filteredVotes: votes,
            stats: {"""
content = content.replace(old_filtered, new_filtered)

# 5. Add filteredVotes to destructuring
old_destruct = "const { filteredEvents, filteredCampaigns, filteredTickets, filteredForms, stats, organizersList, yearsList } = useMemo(() => {"
new_destruct = "const { filteredEvents, filteredCampaigns, filteredTickets, filteredForms, filteredVotes, stats, organizersList, yearsList } = useMemo(() => {"
content = content.replace(old_destruct, new_destruct)

# 6. Update JSX Table
old_jsx_start = """                                    <tr>
                                        <th>Élection</th>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rawVotes.filter(v => 
                                        (filters.organizerId === 'all' || v.organizer_id === filters.organizerId) &&
                                        (filters.year === 'all' || new Date(v.created_at).getFullYear().toString() === filters.year) &&
                                        (filters.month === 'all' || (new Date(v.created_at).getMonth() + 1).toString() === filters.month) &&
                                        (filters.search === '' || v.title.toLowerCase().includes(filters.search.toLowerCase()))
                                    ).map((v: any) => (
                                        <tr key={v.id}>
                                            <td>
                                                <strong>{v.title}</strong>
                                                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>{v.category || 'Non classé'}</p>
                                            </td>
                                            <td>{new Date(v.created_at).toLocaleDateString('fr-FR')}</td>
                                            <td><span className={styles.badge} style={{ background: v.is_paid ? '#fef3c7' : '#e0f2fe', color: v.is_paid ? '#92400e' : '#0369a1' }}>{v.is_paid ? `Payant (${v.price_per_vote} F)` : 'Gratuit'}</span></td>"""

new_jsx_start = """                                    <tr>
                                        <th>Élection</th>
                                        <th>Date</th>
                                        <th>Votes</th>
                                        <th>Revenus</th>
                                        <th>Type</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredVotes.map((v: any) => (
                                        <tr key={v.id}>
                                            <td>
                                                <strong>{v.title}</strong>
                                                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>{v.category || 'Non classé'}</p>
                                            </td>
                                            <td>{new Date(v.created_at).toLocaleDateString('fr-FR')}</td>
                                            <td style={{ fontWeight: 'bold' }}>{v.computedTotalVotes}</td>
                                            <td style={{ fontWeight: 'bold', color: '#047857' }}>{v.computedTotalRevenue.toLocaleString()} F</td>
                                            <td><span className={styles.badge} style={{ background: v.is_paid ? '#fef3c7' : '#e0f2fe', color: v.is_paid ? '#92400e' : '#0369a1' }}>{v.is_paid ? `Payant (${v.price_per_vote} F)` : 'Gratuit'}</span></td>"""
content = content.replace(old_jsx_start, new_jsx_start)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated admin page.tsx')
