# Pinia Stores Documentation

This directory contains all Pinia stores for state management in the Legal Case Management System.

## Available Stores

### 1. User Store (`useUserStore`)

Manages user authentication and profile information.

**State:**
- `user`: Current user information
- `token`: JWT authentication token
- `isLoading`: Loading state for async operations
- `error`: Error messages

**Getters:**
- `isAuthenticated`: Check if user is logged in
- `userRole`: Get current user's role
- `userName`: Get user's display name

**Actions:**
- `login(userData, token)`: Login user and store credentials
- `logout()`: Clear user session
- `updateUserProfile(updates)`: Update user profile
- `hasRole(role)`: Check if user has specific role
- `initializeAuth()`: Initialize auth from localStorage

**Usage Example:**
```typescript
import { useUserStore } from '@/stores'

const userStore = useUserStore()

// Login
userStore.login(userData, token)

// Check authentication
if (userStore.isAuthenticated) {
  console.log('User is logged in')
}

// Logout
userStore.logout()
```

### 2. Case Store (`useCaseStore`)

Manages case data and related operations.

**State:**
- `cases`: Array of all cases
- `currentCase`: Currently selected case
- `isLoading`: Loading state
- `error`: Error messages
- `filters`: Active filters
- `pagination`: Pagination information

**Getters:**
- `filteredCases`: Cases filtered by current filters
- `totalCases`: Total number of cases
- `casesByStatus`: Cases grouped by status
- `casesByType`: Cases grouped by type
- `totalTargetAmount`: Sum of all case target amounts

**Actions:**
- `setCases(caseList)`: Set all cases
- `setCurrentCase(caseData)`: Set current case
- `addCase(caseData)`: Add new case
- `updateCase(id, updates)`: Update existing case
- `removeCase(id)`: Remove case
- `getCaseById(id)`: Get case by ID
- `setFilters(filters)`: Apply filters
- `clearFilters()`: Clear all filters
- `setPagination(page, pageSize, total)`: Update pagination
- `resetStore()`: Reset store to initial state

**Usage Example:**
```typescript
import { useCaseStore } from '@/stores'

const caseStore = useCaseStore()

// Load cases
caseStore.setCases(casesFromAPI)

// Filter cases
caseStore.setFilters({ status: 'active', caseType: '民事' })

// Get filtered results
const filtered = caseStore.filteredCases

// Add new case
caseStore.addCase(newCase)
```

### 3. Notification Store (`useNotificationStore`)

Manages notifications and alerts.

**State:**
- `notifications`: Array of all notifications
- `isLoading`: Loading state
- `error`: Error messages
- `lastFetchTime`: Last time notifications were fetched

**Getters:**
- `unreadCount`: Number of unread notifications
- `unreadNotifications`: Array of unread notifications
- `readNotifications`: Array of read notifications
- `notificationsByType`: Notifications grouped by type
- `urgentNotifications`: Urgent/overdue notifications
- `hasUnreadNotifications`: Boolean indicating unread notifications exist

**Actions:**
- `setNotifications(list)`: Set all notifications
- `addNotification(notification)`: Add single notification
- `addNotifications(list)`: Add multiple notifications
- `markAsRead(id)`: Mark notification as read
- `markAllAsRead()`: Mark all as read
- `markMultipleAsRead(ids)`: Mark multiple as read
- `removeNotification(id)`: Remove notification
- `clearAllNotifications()`: Clear all notifications
- `clearReadNotifications()`: Clear only read notifications
- `getNotificationById(id)`: Get notification by ID
- `getNotificationsByType(type)`: Get notifications by type
- `getNotificationsByRelated(type, id)`: Get notifications by related entity
- `resetStore()`: Reset store to initial state

**Usage Example:**
```typescript
import { useNotificationStore } from '@/stores'

const notificationStore = useNotificationStore()

// Load notifications
notificationStore.setNotifications(notificationsFromAPI)

// Check unread count
console.log(`You have ${notificationStore.unreadCount} unread notifications`)

// Mark as read
notificationStore.markAsRead(notificationId)

// Get urgent notifications
const urgent = notificationStore.urgentNotifications
```

## Store Composition

All stores follow the Composition API pattern with:
- **State**: Reactive references using `ref()`
- **Getters**: Computed properties using `computed()`
- **Actions**: Functions that modify state

## Best Practices

1. **Import from index**: Always import stores from the index file
   ```typescript
   import { useUserStore, useCaseStore } from '@/stores'
   ```

2. **Use in components**: Access stores in setup function or script setup
   ```typescript
   <script setup lang="ts">
   import { useUserStore } from '@/stores'
   const userStore = useUserStore()
   </script>
   ```

3. **Destructure with caution**: Use `storeToRefs` to maintain reactivity
   ```typescript
   import { storeToRefs } from 'pinia'
   const { user, isAuthenticated } = storeToRefs(userStore)
   ```

4. **Error handling**: Always check error state after operations
   ```typescript
   if (caseStore.error) {
     console.error(caseStore.error)
   }
   ```

5. **Loading states**: Use loading states for better UX
   ```typescript
   <div v-if="caseStore.isLoading">Loading...</div>
   ```

## Type Safety

All stores are fully typed with TypeScript. Import types as needed:

```typescript
import type { User, Case, Notification } from '@/stores'
```
