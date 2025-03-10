import React, { PureComponent } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';

import moment from 'moment';

import toUpper from 'lodash/toUpper';
import isEmpty from 'lodash/isEmpty';
import has from 'lodash/has';
import { AlertModal } from '../../components/AlertModal';

import strings from '../../assets/strings';
import { Icons, Backgrounds, Badges } from '../../assets/images';

import { Button, Icon, Map, ReadMore } from '../../components';

import { CLIENT_ERRORS, DEFAULT_ZOOM } from '../../shared/constants';

import MainButton from '../../components/Buttons/MainButton';

import { EVENTS_TRASHPOINTS_SCREEN, EVENTS_MENU_SCREEN } from '../index';

import styles from './styles';


import {
  backId,
  calendarConfig,
  navigatorButtons,
  navigatorStyle,
  trashpoints,
  menuId,
} from './config';

class EventDetails extends PureComponent {
  static navigatorStyle = navigatorStyle;
  static navigatorButtons = navigatorButtons;

  constructor(props) {
    super(props);

    props.navigator.setOnNavigatorEvent(
      this.onNavigatorEvent,
    );

    this.cancelButton = {
      text: strings.label_button_cancel,
      onPress: this.cancelPrivateDialog.bind(this),
    };

    this.registerButton = {
      text: strings.label_register,
      onPress: this.handleLogInPress.bind(this),
    };

    this.state = {
      isEndReached: false,
      showModal: false,
    };
  }

  componentWillMount() {
    const { eventId, onLoadEvent } = this.props;

    onLoadEvent(eventId);
  }
  componentWillUnmount() {
    this.props.onCleanEvent();
  }

  onNavigatorEvent = (event) => {
    if (event.type === 'NavBarButtonPress') {
      switch (event.id) {
        case backId: {
          this.props.navigator.dismissAllModals();
          Platform.OS === 'ios' && this.props.onCleanEvent();
          break;
        }
        case menuId: {
          const photo = (this.props.event && !isEmpty(this.props.event.photos))
            ? this.props.event.photos[0]
            : 'https://image.ibb.co/i8vW6T/img_Event_Cover_Big1.png';
          this.props.navigator.showModal({
            screen: EVENTS_MENU_SCREEN,
            title: 'Menu',
            navigatorStyle: {
              navBarHidden: true,
              screenBackgroundColor: 'transparent',
              modalPresentationStyle: 'overCurrentContext',
            },
            passProps: {
              event: this.props.event,
              profile: this.props.profile,
              onDeleteEvent: this.props.onDeleteEvent,
              onEventDeleted: this.props.onEventDeleted,
              photo,
            },
          });
          break;
        }
        default:
      }
    }

    if (event.type === trashpoints) {
      this.props.navigator.showModal({
        screen: EVENTS_TRASHPOINTS_SCREEN,
        title: strings.label_trashpoints,
      });
    }
  };

  cancelButton = {
    text: strings.label_button_continue,
    onPress: this.closeModal,
  };

  selectImage = () => {
    const { imageIndex } = this.props;
    switch (imageIndex) {
      case 0: return Backgrounds.firstEmptyEventDetail;
      case 1: return Backgrounds.secondEmptyEventDetail;
      case 2: return Backgrounds.thirdEmptyEventDetail;
      default:
    }
  };

  showWarningDialog = (message, buttons) => {
    this.props.navigator.showLightBox({
      screen: 'ERROR_MODAL',
      passProps: {
        error: message,
        buttons,
      },
      style: {
        backgroundBlur: 'dark',
        tapBackgroundToDismiss: true,
      },
    });
  };

  handleEventJoin = () => {
    if (!this.props.profile) {
      const buttons = [this.cancelButton, this.registerButton];
      this.showWarningDialog(CLIENT_ERRORS.registerEventError, buttons);
      return;
    } else if (this.props.event.maxPeopleAmount !== this.props.event.attendeesAmount) {
      this.props.onJoinEvent(this.props.eventId);
      return;
    }
    this.openModal();
  };

  handleLogInPress = () => {
    if (Platform.OS === 'android') {
      this.cancelPrivateDialog();
    }
    const { onGuestLogIn } = this.props;
    onGuestLogIn();
  };

  cancelPrivateDialog = () => {
    this.props.navigator.dismissModal();
    this.props.navigator.dismissLightBox();
  };

  openModal = () => {
    this.setState({ showModal: true });
  };

  closeModal = () => {
    this.setState({ showModal: false });
  };

  handlePhoneNumberOpen = (phoneNumber) => {
    const formatedPhoneNumber = phoneNumber && `tel:${phoneNumber}`;

    Linking.canOpenURL(formatedPhoneNumber).then(
      (supported) => {
        if (!supported) {
          console.log(`Can't handle url: ${formatedPhoneNumber}`);
        } else {
          return Linking.openURL(formatedPhoneNumber);
        }
      }).catch(err => console.log('An error occurred', err));
  }

  handleRenderImage() {
    const { event } = this.props;
    const bgImage = !isEmpty(event.photos)
      ? { uri: event.photos[0] }
      : this.selectImage();
    return (
      <Image
        style={styles.coverImage}
        source={bgImage}
      />
    );
  }

  handleRenderButton() {
    const { event, profile } = this.props;

    if (!profile ||
      (event.createdBy !== profile.id && event.attendees.indexOf(profile.id) === -1)) {
      return (
        <View style={styles.buttonContainer}>
          <MainButton
            isValid
            text={strings.lable_join_event}
            style={styles.button}
            onPress={this.handleEventJoin}
          />
        </View>
      );
    }
  }

  handleRenderDate() {
    const { event } = this.props;

    const isToTime = has(event, 'endTime');

    const formatedDate = moment(event.startTime).format('DD MMMM, HH:mm');
    const fromatedToTime = isToTime && moment(event.endTime).format('HH:mm');
    const calendarTime = moment(event.startTime).calendar(null, calendarConfig);

    const timeToStart = isToTime ? `${formatedDate} - ${fromatedToTime}` : formatedDate;
    return (
      <View style={styles.dateContainer}>
        <Icon path={Icons.Time} />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{timeToStart}</Text>
          <Text style={styles.calendarText}>{calendarTime}</Text>
        </View>
      </View>
    );
  }

  handleRenderLocation() {
    const { event } = this.props;

    if (!event.location) return null;

    const initialRegion = {
      latitude: event.location.latitude,
      longitude: event.location.longitude,
      latitudeDelta: DEFAULT_ZOOM * 2,
      longitudeDelta: DEFAULT_ZOOM * 2,
    };

    const marker = {
      id: event.location.latitude,
      latlng: {
        latitude: event.location.latitude,
        longitude: event.location.longitude,
      },
      location: {
        latitude: event.location.latitude,
        longitude: event.location.longitude,
      },
    };

    return (
      <View>
        <View style={styles.locationContainer}>
          <Icon path={Icons.Map} />
          <Text
            numberOfLines={2}
            style={styles.locationText}
          >
            {event.address}
          </Text>
        </View>
        <View style={styles.mapContainer}>
          <Map
            markers={[marker]}
            region={initialRegion}
          />
        </View>
      </View>
    );
  }

  handleRenderCircle() {
    const { event } = this.props;

    if (!isEmpty(event.trashpoints)) {
      return (
        <View style={styles.circleContainer}>
          <Text style={styles.circleText}>
            {event.trashpoints.length}
          </Text>
        </View>
      );
    }
  }

  handleRenderTrashpoints() {
    const navigation = { type: trashpoints };
    return (
      <TouchableOpacity
        onPress={this.onNavigatorEvent.bind(this, navigation)}
        style={styles.trashpointsContainer}
      >
        <Icon path={Icons.Trashpoints} />
        <Text style={styles.locationText}>
          {strings.label_tap_to_preview_trashpoints}
        </Text>
        <View style={styles.trashpointsRightContainer}>
          {this.handleRenderCircle()}
          <Icon path={Icons.Back} iconStyle={styles.arrowIcon} />
        </View>
      </TouchableOpacity>
    );
  }

  handleRenderDescription() {
    const { event } = this.props;
    return (
      <ReadMore
        numberOfLines={3}
        style={styles.readMoreContainer}
      >
        <Text style={styles.locationText}>
          {event.description}
        </Text>
      </ReadMore>
    );
  }

  handleRenderWhatToBring() {
    const { event } = this.props;
    return (
      <ReadMore
        numberOfLines={3}
        style={styles.readMoreContainer}
      >
        <Text style={styles.locationText}>
          {event.whatToBring}
        </Text>
      </ReadMore>
    );
  }

  handleRenderCoordinator() {
    const { event } = this.props;
    return (
      <View>
        {event.coordinatorName &&
          <View style={styles.coordinatorContainerItem}>
            <Icon path={Icons.Person} />
            <Text style={styles.coordinatorTextItem}>
              {event.coordinatorName}
            </Text>
          </View>
        }
        <View style={styles.coordinatorContainerItem}>
          <Icon path={Icons.GroupPeople} />
          <Text style={styles.noOrganizationText}>
            {strings.label_no_organization}
          </Text>
        </View>
        {event.phonenumber &&
          <View style={styles.coordinatorContainerItem}>
            <Icon path={Icons.Phone} iconStyle={styles.phoneIconStyle} />
            <TouchableOpacity
              onPress={this.handlePhoneNumberOpen.bind(this, event.phonenumber)}
            >
              <Text style={styles.coordinatorPhoneNumber}>
                {event.phonenumber}
              </Text>
            </TouchableOpacity>
          </View>
        }
        {!isEmpty(event.email) &&
          <View style={styles.coordinatorContainerItem}>
            <Icon path={Icons.Email} />
            <Text style={styles.coordinatorTextItem}>
              {event.email}
            </Text>
          </View>}
      </View>
    );
  }
  handleRenderCreator() {
    const { event } = this.props;

    return (
      <View>
        {event.createdByName &&
          <View style={styles.coordinatorContainerItem}>
            <Icon path={Icons.Person} />
            <Text style={styles.coordinatorTextItem}>
              {event.createdByName}
            </Text>
          </View>
        }
      </View>
    );
  }

  hadnleRenderAttendees() {
    const { event } = this.props;
    const string = `${event.attendeesAmount
      ? event.attendeesAmount : '0'}/${event.maxPeopleAmount}`;
    return (
      <View style={styles.trashpointsContainer}>
        <Icon path={Icons.List} />
        <Text style={styles.locationText}>{string}</Text>
      </View>
    );
  }
  spinner() {
    return (
      <View style={{
        backgroundColor: '#ffffff',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
      }}
      >
        <ActivityIndicator
          style={[styles.spinner]}
          size="large"
          color="rgb(0, 143, 223)"
        />
      </View>
    );
  }

  handleIsCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
    const paddingToBottom = 20;
    return layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;
  };

  handleScrollToEnd = () => this.scrollView.scrollToEnd({ animated: true });

  handleScroll = ({ nativeEvent }) => {
    if (this.handleIsCloseToBottom(nativeEvent)) {
      this.setState({ isEndReached: true });
    }
  }

  render() {
    const { event } = this.props;
    const { isEndReached, showModal } = this.state;
    if (!event) return this.spinner();
    return (
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          ref={(ref) => { this.scrollView = ref; }}
          scrollEventThrottle={800}
          onScroll={this.handleScroll}
        >
          <AlertModal
            visible={showModal}
            title={strings.label_leave_title}
            subtitle={strings.label_no_place_left_title}
            text={strings.label_no_place_left_text}
            image={Badges.CannotJoin}
            onOverlayPress={this.closeModal}
            onPress={this.closeModal}
          />
          <View style={styles.container}>
            {this.handleRenderImage()}
            <View style={styles.nameContainer}>
              <Text numberOfLines={2} style={styles.name}>{event.name}</Text>
            </View>
            {this.handleRenderButton()}
            {<Text style={styles.title}>{toUpper(strings.lable_date_and_time)}</Text>}
            {this.handleRenderDate()}
            <Text style={styles.title}>{toUpper(strings.label_location)}</Text>
            {this.handleRenderLocation()}
            <Text style={styles.title}>{toUpper(strings.label_trashpoints)}</Text>
            {this.handleRenderTrashpoints()}
            <Text style={styles.title}>{toUpper(strings.label_description)}</Text>
            {this.handleRenderDescription()}
            <Text style={styles.title}>{toUpper(strings.label_what_to_bring)}</Text>
            {this.handleRenderWhatToBring()}
            <Text style={styles.title}>{toUpper(strings.label_creator)}</Text>
            {this.handleRenderCreator()}
            <Text style={styles.title}>{toUpper(strings.lable_coordinator)}</Text>
            {this.handleRenderCoordinator()}
            <Text style={styles.title}>{toUpper(strings.label_attendees)}</Text>
            {this.hadnleRenderAttendees()}
          </View>
        </ScrollView>

        {!isEndReached && <Button
          style={styles.floatingButton}
          iconStyle={styles.iconFloatingButton}
          icon={Icons.Back}
          onPress={this.handleScrollToEnd}
        />}
      </View>
    );
  }
}

EventDetails.propTypes = {
  profile: PropTypes.object,
  event: PropTypes.object,
  imageIndex: PropTypes.number,
  eventId: PropTypes.string,
  navigator: PropTypes.object,
  onLoadEvent: PropTypes.func,
  onCleanEvent: PropTypes.func,
  onDeleteEvent: PropTypes.func,
  onGuestLogIn: PropTypes.func,
};

export default EventDetails;
