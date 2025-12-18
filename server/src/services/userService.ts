import { User, IUser } from '../models/User';

/**
 * Найти или создать пользователя
 */
export const findOrCreateUser = async (
  telegramId: number,
  username?: string,
  firstName?: string,
  lastName?: string
): Promise<IUser> => {
  let user = await User.findOne({ telegramId });

  if (!user) {
    user = new User({
      telegramId,
      username,
      firstName,
      lastName,
      gamesPlayed: 0,
      gamesWon: 0,
    });
    await user.save();
  } else {
    // Обновить информацию, если изменилась
    if (username && user.username !== username) {
      user.username = username;
    }
    if (firstName && user.firstName !== firstName) {
      user.firstName = firstName;
    }
    if (lastName && user.lastName !== lastName) {
      user.lastName = lastName;
    }
    await user.save();
  }

  return user;
};

/**
 * Получить пользователя по Telegram ID
 */
export const getUserByTelegramId = async (telegramId: number): Promise<IUser | null> => {
  return await User.findOne({ telegramId });
};

/**
 * Обновить статистику игрока после победы
 */
export const updateUserStats = async (telegramId: number, won: boolean): Promise<void> => {
  const user = await User.findOne({ telegramId });
  if (user) {
    user.gamesPlayed += 1;
    if (won) {
      user.gamesWon += 1;
    }
    await user.save();
  }
};


