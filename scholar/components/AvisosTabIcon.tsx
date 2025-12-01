import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { avisosService } from '@/services/avisosService';
import { avisosLidosService } from '@/services/avisosLidosService';

interface AvisosTabIconProps {
  color: string;
  focused: boolean;
}

export function AvisosTabIcon({ color, focused }: AvisosTabIconProps) {
  const [novosAvisos, setNovosAvisos] = useState(0);

  useEffect(() => {
    carregarNovosAvisos();
    // Atualizar a cada 30 segundos
    const interval = setInterval(carregarNovosAvisos, 30000);
    return () => clearInterval(interval);
  }, []);

  const carregarNovosAvisos = async () => {
    try {
      const avisos = await avisosService.listar();
      const count = await avisosLidosService.contarNovosAvisos(avisos);
      setNovosAvisos(count);
    } catch (error) {
      console.error('Erro ao carregar novos avisos:', error);
    }
  };

  return (
    <View style={styles.container}>
      <IconSymbol size={28} name="bell.fill" color={color} />
      {novosAvisos > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {novosAvisos > 99 ? '99+' : novosAvisos}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

