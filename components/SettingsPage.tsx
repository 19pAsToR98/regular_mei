import React, { useState, useEffect, useRef } from 'react';
import { Category, User } from '../types';
import { showSuccess, showError, showWarning } from '../utils/toastUtils';

const availableIcons = [
  'work', 'shopping_cart', 'shopping_bag', 'inventory_2', 'savings', 
  'account_balance', 'payments', 'attach_money', 'receipt_long', 'credit_card',
  'local_shipping', 'wifi', 'computer', 'phone_iphone', 'build', 
  'restaurant', 'flight', 'directions_car', 'home', 'apartment',
  'school', 'health_and_safety', 'fitness_center', 'groups', 'campaign',
  'content_cut', 'palette', 'camera_alt', 'music_note', 'pets',
  'store', 'laptop_mac', 'verified_user', 'analytics', 'fastfood',
  'local_gas_station', 'medical_services', 'subscriptions', 'lightbulb',
  'gavel', 'brush', 'construction', 'fitness_center', 'public',
  'attach_file', 'trending_up', 'trending_down', 'sync', 'pie_chart',
  'schedule', 'event', 'paid', 'sell', 'redeem', 'volunteer_activism'
];

interface SettingsPageProps {
  user?: User | null;
// ... restante do código permanece o mesmo