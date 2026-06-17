import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface EntityContentResult {
  content: string
  metadata?: Record<string, unknown>
  user_id?: string | null
  source_id?: string | null
  unified_document_id?: string | null
}

export async function resolveEntityContent(
  supabase: SupabaseClient,
  entity_type: string,
  entity_id: string
): Promise<EntityContentResult | null> {
  switch (entity_type) {
    case 'knowledge_entry': {
      const { data } = await supabase
        .from('knowledge_entries')
        .select('id, title, content, summary, created_by')
        .eq('id', entity_id)
        .maybeSingle()
      if (!data?.content) return null
      const text = `# ${data.title}\n\n${data.summary ? data.summary + '\n\n' : ''}${data.content}`
      return { content: text, metadata: { title: data.title }, user_id: data.created_by }
    }
    case 'knowledge_file': {
      const { data } = await supabase
        .from('knowledge_files')
        .select('id, title, file_name, storage_path, uploaded_by, source_id, metadata')
        .eq('id', entity_id)
        .maybeSingle()
      if (!data?.storage_path) return null
      const { data: fileData } = await supabase.storage.from('knowledge').download(data.storage_path)
      if (!fileData) return null
      const content = await fileData.text()
      return {
        content: `# ${data.title || data.file_name}\n\n${content}`,
        metadata: { title: data.title, file_name: data.file_name },
        user_id: data.uploaded_by,
        source_id: data.source_id,
      }
    }
    case 'unified_document': {
      const { data } = await supabase
        .from('unified_documents')
        .select('id, title, content, user_id, metadata')
        .eq('id', entity_id)
        .maybeSingle()
      if (!data) return null
      const content = data.content || (data.metadata as Record<string, string>)?.extracted_text || ''
      if (!content) return null
      return {
        content: `# ${data.title}\n\n${content}`,
        metadata: { title: data.title },
        user_id: data.user_id,
        unified_document_id: data.id,
      }
    }
    default:
      return null
  }
}
