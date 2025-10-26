import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Verificar autenticação
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é coach
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'coach') {
      return NextResponse.json({ error: 'Apenas coaches podem fazer upload' }, { status: 403 });
    }

    // Pegar dados do FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const alunoId = formData.get('alunoId') as string;
    const type = formData.get('type') as 'diet' | 'workout';

    if (!file || !alunoId || !type) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Validar tipo de arquivo
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Apenas arquivos PDF são permitidos' }, { status: 400 });
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande (máximo 10MB)' }, { status: 400 });
    }

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Definir caminho no storage
    const timestamp = Date.now();
    const fileName = `${alunoId}_${type}_${timestamp}.pdf`;
    const storagePath = `student-files/${alunoId}/${type}/${fileName}`;

    // Upload para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('student-documents')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      return NextResponse.json({ error: 'Erro ao fazer upload do arquivo' }, { status: 500 });
    }

    // Pegar URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from('student-documents')
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;

    // Extrair texto do PDF para o campo content
    const pdfText = await extractTextFromPDF(buffer);

    // Criar registro na tabela correspondente
    const tableName = type === 'diet' ? 'dietas' : 'treinos';
    const title = type === 'diet' ? 'Dieta - Arquivo PDF' : 'Treino - Arquivo PDF';

    const { error: insertError } = await supabase
      .from(tableName)
      .insert({
        aluno_id: alunoId,
        title: title,
        content: pdfText || `Arquivo PDF enviado: ${fileName}\n\nURL: ${fileUrl}`,
        active: true,
      });

    if (insertError) {
      console.error('Erro ao criar registro:', insertError);
      // Tentar deletar o arquivo do storage se falhar
      await supabase.storage.from('student-documents').remove([storagePath]);
      return NextResponse.json({ error: 'Erro ao salvar no banco de dados' }, { status: 500 });
    }

    // Verificar se o aluno já tem dieta E treino
    const { data: hasDiet } = await supabase
      .from('dietas')
      .select('id')
      .eq('aluno_id', alunoId)
      .eq('active', true)
      .single();

    const { data: hasWorkout } = await supabase
      .from('treinos')
      .select('id')
      .eq('aluno_id', alunoId)
      .eq('active', true)
      .single();

    return NextResponse.json({
      success: true,
      message: `${type === 'diet' ? 'Dieta' : 'Treino'} enviado com sucesso`,
      fileUrl,
      has_diet: !!hasDiet,
      has_workout: !!hasWorkout,
    });
  } catch (error: any) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}

// Função auxiliar para extrair texto do PDF (básico)
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Por enquanto, retornar uma string padrão
    // Você pode adicionar uma biblioteca como pdf-parse se quiser extrair o texto real
    return 'Conteúdo do PDF (extração de texto requer biblioteca adicional)';
  } catch (error) {
    console.error('Erro ao extrair texto do PDF:', error);
    return 'PDF enviado';
  }
}
