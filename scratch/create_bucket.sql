-- Script to create the campaign_frames bucket and its security policies

-- Create the bucket
insert into storage.buckets (id, name, public) 
values ('campaign_frames', 'campaign_frames', true);

-- Policy to allow public read access
create policy "Public Access" 
on storage.objects for select 
using ( bucket_id = 'campaign_frames' );

-- Policy to allow authenticated users to upload files
create policy "Auth Upload" 
on storage.objects for insert 
to authenticated 
with check ( bucket_id = 'campaign_frames' );

-- Policy to allow users to update their own files
create policy "Auth Update" 
on storage.objects for update 
to authenticated 
using ( bucket_id = 'campaign_frames' and auth.uid() = owner );

-- Policy to allow users to delete their own files
create policy "Auth Delete" 
on storage.objects for delete 
to authenticated 
using ( bucket_id = 'campaign_frames' and auth.uid() = owner );
