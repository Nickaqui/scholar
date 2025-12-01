import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { avisosService, Aviso } from '@/services/avisosService';
import { avisosLidosService } from '@/services/avisosLidosService';

export default function AvisosScreen() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [avisosLidos, setAvisosLidos] = useState<number[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => {
    carregarAvisos();
    carregarAvisosLidos();
  }, []);

  // Atualizar quando a tela receber foco (útil quando volta de criar aviso)
  useFocusEffect(
    useCallback(() => {
      carregarAvisos();
      carregarAvisosLidos();
    }, [])
  );

  const carregarAvisosLidos = async () => {
    const lidos = await avisosLidosService.obterAvisosLidos();
    setAvisosLidos(lidos);
  };

  const carregarAvisos = async () => {
    setCarregando(true);
    try {
      const dados = await avisosService.listar();
      setAvisos(dados);
      // Marcar todos os avisos visíveis como lidos após carregar
      const ids = dados.map(a => a.id);
      await avisosLidosService.marcarMultiplosComoLidos(ids);
      await carregarAvisosLidos();
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao carregar avisos');
      console.error('Erro ao carregar avisos:', error);
    } finally {
      setCarregando(false);
    }
  };

  const onRefresh = async () => {
    setAtualizando(true);
    await carregarAvisos();
    await carregarAvisosLidos();
    setAtualizando(false);
  };

  const isNovoAviso = (avisoId: number) => {
    return !avisosLidos.includes(avisoId);
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'institucional':
        return '#2563eb';
      case 'lembrete':
        return '#f59e0b';
      case 'comunicado':
        return '#10b981';
      case 'prova':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'institucional':
        return 'Institucional';
      case 'lembrete':
        return 'Lembrete';
      case 'comunicado':
        return 'Comunicado';
      case 'prova':
        return 'Prova';
      default:
        return tipo;
    }
  };

  const formatarData = (data: string) => {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const podeCriarAviso = usuario?.tipo === 'administrador' || usuario?.tipo === 'professor';

  if (carregando && avisos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando avisos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Avisos Acadêmicos</Text>
        {podeCriarAviso && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(tabs)/criar-aviso')}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={onRefresh} />
        }
      >
        {avisos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum aviso publicado ainda</Text>
          </View>
        ) : (
          avisos.map((aviso) => {
            const novo = isNovoAviso(aviso.id);
            return (
            <View key={aviso.id} style={[styles.card, novo && styles.cardNovo]}>
              {novo && (
                <View style={styles.novoBadge}>
                  <Text style={styles.novoBadgeText}>NOVO</Text>
                </View>
              )}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[
                      styles.tipoBadge,
                      { backgroundColor: getTipoColor(aviso.tipo) },
                    ]}
                  >
                    <Text style={styles.tipoText}>
                      {getTipoLabel(aviso.tipo)}
                    </Text>
                  </View>
                  {aviso.disciplina_nome && (
                    <Text style={styles.disciplina}>
                      {aviso.disciplina_nome}
                    </Text>
                  )}
                </View>
              </View>

              <Text style={styles.titulo}>{aviso.titulo}</Text>
              <Text style={styles.conteudo}>{aviso.conteudo}</Text>

              {aviso.data_evento && (
                <View style={styles.dataEventoContainer}>
                  <Ionicons name="calendar" size={16} color="#f59e0b" />
                  <Text style={styles.dataEvento}>
                    Data do evento: {new Date(aviso.data_evento).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.autorContainer}>
                  <Ionicons name="person" size={14} color="#666" />
                  <Text style={styles.autor}>
                    {aviso.autor_nome || 'Sistema'}
                  </Text>
                </View>
                <Text style={styles.data}>
                  {formatarData(aviso.data_publicacao)}
                </Text>
              </View>
            </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 0,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  cardNovo: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  novoBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  novoBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tipoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  disciplina: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  conteudo: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 12,
  },
  dataEventoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  dataEvento: {
    fontSize: 14,
    color: '#92400e',
    marginLeft: 6,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  autorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  autor: {
    fontSize: 12,
    color: '#666',
  },
  data: {
    fontSize: 12,
    color: '#999',
  },
});

