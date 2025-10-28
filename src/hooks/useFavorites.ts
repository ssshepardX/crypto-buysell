import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

const fetchFavorites = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('symbol')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return data.map(fav => fav.symbol);
};

const addFavorite = async ({ userId, symbol }: { userId: string; symbol: string }) => {
  const { error } = await supabase
    .from('user_favorites')
    .insert({ user_id: userId, symbol });

  if (error) throw new Error(error.message);
};

const removeFavorite = async ({ userId, symbol }: { userId: string; symbol: string }) => {
  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('symbol', symbol);

  if (error) throw new Error(error.message);
};

export const useFavorites = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', userId],
    queryFn: () => fetchFavorites(userId!),
    enabled: !!userId,
  });

  const addMutation = useMutation({
    mutationFn: addFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
  });

  const toggleFavorite = (symbol: string) => {
    if (!userId) return;
    const isFavorite = favorites.includes(symbol);
    if (isFavorite) {
      removeMutation.mutate({ userId, symbol });
    } else {
      addMutation.mutate({ userId, symbol });
    }
  };

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isMutating: addMutation.isPending || removeMutation.isPending,
  };
};