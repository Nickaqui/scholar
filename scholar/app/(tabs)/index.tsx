import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import boletimService, { BoletimDisciplina } from '@/services/boletimService';

export default function HomeScreen() {
  const { usuario, logout } = useAuth();
  const router = useRouter();
  const [boletim, setBoletim] = useState<BoletimDisciplina[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => {
    if (usuario?.tipo === 'aluno') {
      carregarBoletim();
    }
  }, [usuario]);

  const carregarBoletim = async () => {
    setCarregando(true);
    try {
      // Para alunos, não passa ID (backend pega do token)
      // Para admin/professor, passaria o ID do aluno a consultar
      const response = await boletimService.obterBoletim();
      setBoletim(response.boletim);
    } catch (error: any) {
      console.error('Erro ao carregar boletim:', error);
    } finally {
      setCarregando(false);
    }
  };

  const onRefresh = async () => {
    setAtualizando(true);
    await carregarBoletim();
    setAtualizando(false);
  };

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'Aprovado':
        return '#10b981';
      case 'Recuperação':
        return '#f59e0b';
      case 'Reprovado':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const renderDashboardAluno = () => {
    if (carregando) {
  return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Carregando boletim...</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Olá, {usuario?.nome || 'Aluno'}!</Text>
          <Text style={styles.subgreeting}>Matrícula: {usuario?.matricula}</Text>
          <Text style={styles.course}>{usuario?.curso}</Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.avisosCard}
            onPress={() => router.push('/(tabs)/avisos')}
          >
            <View style={styles.avisosCardIcon}>
              <Ionicons name="notifications" size={24} color="#2563eb" />
            </View>
            <View style={styles.avisosCardContent}>
              <Text style={styles.avisosCardTitle}>Avisos Acadêmicos</Text>
              <Text style={styles.avisosCardSubtitle}>
                Veja os últimos comunicados e avisos
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meu Boletim</Text>
          
          {boletim.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Você ainda não está matriculado em nenhuma disciplina.
              </Text>
            </View>
          ) : (
            boletim.map((item, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.disciplinaNome}>{item.disciplina.nome}</Text>
                  <View
                    style={[
                      styles.situacaoBadge,
                      { backgroundColor: getSituacaoColor(item.situacao) },
                    ]}
                  >
                    <Text style={styles.situacaoText}>{item.situacao}</Text>
                  </View>
                </View>
                
                <Text style={styles.disciplinaCodigo}>
                  {item.disciplina.codigo} • {item.disciplina.carga_horaria}h
                </Text>
                
                {item.disciplina.professor && (
                  <Text style={styles.professor}>
                    Prof. {item.disciplina.professor}
                  </Text>
                )}

                <View style={styles.notasContainer}>
                  {item.notas.map((nota, idx) => (
                    <View key={idx} style={styles.notaItem}>
                      <Text style={styles.notaTipo}>{nota.tipo_avaliacao}</Text>
                      <Text style={styles.notaValor}>{nota.nota.toFixed(1)}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.mediaContainer}>
                  <Text style={styles.mediaLabel}>Média Final:</Text>
                  <Text style={styles.mediaValor}>{item.media}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderDashboardProfessor = () => {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Olá, Prof. {usuario?.nome}!</Text>
          {usuario?.titulacao && (
            <Text style={styles.subgreeting}>{usuario.titulacao}</Text>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.adminCard}
            onPress={() => router.push('/(tabs)/avisos')}
          >
            <View style={styles.adminCardIcon}>
              <Ionicons name="notifications" size={32} color="#8b5cf6" />
            </View>
            <View style={styles.adminCardContent}>
              <Text style={styles.adminCardTitle}>Avisos Acadêmicos</Text>
              <Text style={styles.adminCardSubtitle}>
                Ver e criar avisos para os alunos
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gerenciamento de Notas</Text>
          
          <TouchableOpacity 
            style={styles.adminCard}
            onPress={() => router.push('/(professor)/disciplinas')}
          >
            <View style={styles.adminCardIcon}>
              <Ionicons name="book" size={32} color="#2563eb" />
            </View>
            <View style={styles.adminCardContent}>
              <Text style={styles.adminCardTitle}>Minhas Disciplinas</Text>
              <Text style={styles.adminCardSubtitle}>
                Ver disciplinas e alunos matriculados
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adminCard}
            onPress={() => router.push('/(professor)/disciplinas')}
          >
            <View style={styles.adminCardIcon}>
              <Ionicons name="create" size={32} color="#10b981" />
            </View>
            <View style={styles.adminCardContent}>
              <Text style={styles.adminCardTitle}>Lançar Notas</Text>
              <Text style={styles.adminCardSubtitle}>
                Registrar notas de avaliações
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderDashboardAdmin = () => {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Painel Administrativo</Text>
          <Text style={styles.subgreeting}>Bem-vindo, {usuario?.email}</Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.adminCard}
            onPress={() => router.push('/(tabs)/avisos')}
          >
            <View style={styles.adminCardIcon}>
              <Ionicons name="notifications" size={32} color="#8b5cf6" />
            </View>
            <View style={styles.adminCardContent}>
              <Text style={styles.adminCardTitle}>Avisos Acadêmicos</Text>
              <Text style={styles.adminCardSubtitle}>
                Gerenciar avisos e comunicados
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gerenciamento</Text>
          
          <TouchableOpacity 
            style={styles.adminCard}
            onPress={() => router.push('/(admin)/alunos')}
          >
            <View style={styles.adminCardIcon}>
              <Ionicons name="school" size={32} color="#2563eb" />
            </View>
            <View style={styles.adminCardContent}>
              <Text style={styles.adminCardTitle}>Alunos</Text>
              <Text style={styles.adminCardSubtitle}>
                Gerenciar cadastro de alunos
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adminCard}
            onPress={() => router.push('/(admin)/professores')}
          >
            <View style={styles.adminCardIcon}>
              <Ionicons name="people" size={32} color="#10b981" />
            </View>
            <View style={styles.adminCardContent}>
              <Text style={styles.adminCardTitle}>Professores</Text>
              <Text style={styles.adminCardSubtitle}>
                Gerenciar cadastro de professores
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adminCard}
            onPress={() => router.push('/(admin)/disciplinas')}
          >
            <View style={styles.adminCardIcon}>
              <Ionicons name="book" size={32} color="#f59e0b" />
            </View>
            <View style={styles.adminCardContent}>
              <Text style={styles.adminCardTitle}>Disciplinas</Text>
              <Text style={styles.adminCardSubtitle}>
                Gerenciar cadastro de disciplinas
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adminCard}
            onPress={() => router.push('/(admin)/matriculas')}
          >
            <View style={styles.adminCardIcon}>
              <Ionicons name="document-text" size={32} color="#8b5cf6" />
            </View>
            <View style={styles.adminCardContent}>
              <Text style={styles.adminCardTitle}>Matrículas</Text>
              <Text style={styles.adminCardSubtitle}>
                Gerenciar matrículas de alunos
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderContent = () => {
    switch (usuario?.tipo) {
      case 'aluno':
        return renderDashboardAluno();
      case 'professor':
        return renderDashboardProfessor();
      case 'administrador':
        return renderDashboardAdmin();
      default:
        return null;
    }
  };

  return renderContent();
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
    paddingBottom: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subgreeting: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  course: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },
  disciplinaNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  disciplinaCodigo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  professor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  situacaoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  situacaoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  notasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  notaItem: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  notaTipo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  notaValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  mediaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  mediaLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  mediaValor: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  adminCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  adminCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adminCardContent: {
    flex: 1,
  },
  adminCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  adminCardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  avisosCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  avisosCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avisosCardContent: {
    flex: 1,
  },
  avisosCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  avisosCardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
});
