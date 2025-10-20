import { Stack } from 'expo-router';

export default function ProfessorLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="disciplinas" 
        options={{ 
          title: 'Minhas Disciplinas',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="lancar-notas" 
        options={{ 
          title: 'Lançar Notas',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="gerenciar-notas" 
        options={{ 
          title: 'Gerenciar Notas',
          headerShown: true 
        }} 
      />
    </Stack>
  );
}

